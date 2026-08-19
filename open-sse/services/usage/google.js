/**
 * Google usage handlers (Gemini CLI + Antigravity)
 */

import { CLIENT_METADATA } from "../../config/appConstants.js";
import { ANTIGRAVITY_IDE_USER_AGENT, ANTIGRAVITY_IDE_VERSION, ANTIGRAVITY_OAUTH_CLIENT } from "../../providers/shared.js";
import { U, parseResetTime, normalizeCloudCodeProjectId, fetchWithTimeout } from "./shared.js";

// Antigravity API config (from Quotio) — urls from registry, oauth client + dynamic UA kept here
const ANTIGRAVITY_CONFIG = {
  ...U("antigravity"),
  ...ANTIGRAVITY_OAUTH_CLIENT,
  userAgent: ANTIGRAVITY_IDE_USER_AGENT,
};

const ANTIGRAVITY_QUOTA_SUMMARY_URLS = [
  "https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary",
  "https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary",
  "https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:retrieveUserQuotaSummary",
];

function resolvePlanName(subInfo) {
  const effectiveTier = subInfo?.paidTier?.id ? subInfo.paidTier : subInfo?.currentTier;
  const tierId = String(effectiveTier?.id || "").toLowerCase();
  if (tierId.includes("ultra-lite")) return "Ultra-Lite";
  if (tierId.includes("ultra")) return "Ultra";
  if (tierId.includes("pro")) return "Pro";
  if (tierId.includes("free")) return "Free";
  return effectiveTier?.name || "Unknown";
}

function parseQuotaSummaryData(data) {
  const groups = [];
  const quotas = {};

  if (Array.isArray(data?.groups)) {
    for (const group of data.groups) {
      const groupLabel = group.displayName || group.display_name || "Quota Group";
      const groupDescription = group.description || "";
      const buckets = [];

      if (Array.isArray(group.buckets)) {
        for (const bucket of group.buckets) {
          const rawFraction = bucket.remainingFraction != null
            ? Number(bucket.remainingFraction)
            : bucket.remaining_fraction != null
              ? Number(bucket.remaining_fraction)
              : 1;
          const remainingFraction = Number.isFinite(rawFraction)
            ? Math.max(0, Math.min(1, rawFraction))
            : 1;
          const bucketLabel = bucket.displayName || bucket.display_name || bucket.bucketId || bucket.bucket_id || "Limit";
          const window = bucket.window || "";
          const resetTime = bucket.resetTime || bucket.reset_time || null;
          const resetAt = parseResetTime(resetTime);
          const remainingPercentage = Math.round(remainingFraction * 100);
          const total = 1000;
          const remaining = Math.round(total * remainingFraction);
          const used = Math.max(0, total - remaining);

          const bucketItem = {
            id: bucket.bucketId || bucket.bucket_id || (groupLabel + "-" + bucketLabel),
            label: bucketLabel,
            displayName: bucketLabel,
            window,
            remainingFraction,
            remainingPercentage,
            resetTime,
            resetAt,
            used,
            total,
            description: bucket.description || "",
          };
          buckets.push(bucketItem);

          const quotaKey = groupLabel + " - " + bucketLabel;
          quotas[quotaKey] = {
            name: quotaKey,
            used,
            total,
            resetAt,
            remainingPercentage,
            displayName: bucketLabel,
            groupName: groupLabel,
            window,
          };
        }
      }

      buckets.sort((a, b) => {
        const getOrder = (item) => {
          const w = String(item.window || "").toLowerCase();
          const l = String(item.displayName || item.label || "").toLowerCase();
          if (w.includes("5") || w.includes("hour") || l.includes("five") || l.includes("5")) return 0;
          if (w.includes("week") || l.includes("week")) return 1;
          if (w.includes("day") || l.includes("day")) return 2;
          return 99;
        };
        return getOrder(a) - getOrder(b);
      });

      groups.push({
        id: group.groupId || group.group_id || groupLabel.toLowerCase().replace(/\s+/g, "-"),
        label: groupLabel,
        displayName: groupLabel,
        description: groupDescription,
        buckets,
      });
    }
  } else if (data?.models) {
    const importantModels = [
      "gemini-3.7-flash-high",
      "gemini-3.7-flash-medium",
      "gemini-3.7-flash-low",
      "gemini-3.6-flash-high",
      "gemini-3.6-flash-medium",
      "gemini-3.6-flash-low",
      "gemini-3.5-flash-low",
      "gemini-3.5-flash-extra-low",
      "gemini-pro-agent",
      "gemini-3.1-pro-low",
      "claude-sonnet-4-6",
      "claude-opus-4-6-thinking",
      "gpt-oss-120b-medium",
      "gemini-3.1-flash-image",
    ];

    for (const [modelKey, info] of Object.entries(data.models)) {
      if (!info.quotaInfo || info.isInternal || !importantModels.includes(modelKey)) {
        continue;
      }
      const remainingFraction = info.quotaInfo.remainingFraction || 0;
      const remainingPercentage = remainingFraction * 100;
      const total = 1000;
      const remaining = Math.round(total * remainingFraction);
      const used = total - remaining;

      quotas[modelKey] = {
        used,
        total,
        resetAt: parseResetTime(info.quotaInfo.resetTime),
        remainingPercentage,
        unlimited: false,
        displayName: info.displayName || modelKey,
      };
    }
  }

  return { groups, quotas };
}

/**
 * Gemini CLI Usage — fetch per-model quota via Cloud Code Assist API.
 * Uses retrieveUserQuota (same endpoint as `gemini /stats`) returning
 * per-model buckets with remainingFraction + resetTime.
 */
export async function getGeminiUsage(accessToken, providerSpecificData, proxyOptions = null) {
  if (!accessToken) {
    return { plan: "Free", message: "Gemini CLI access token not available." };
  }

  try {
    let projectId = normalizeCloudCodeProjectId(providerSpecificData?.projectId);
    let plan = "Free";

    if (!projectId) {
      const subInfo = await getGeminiSubscriptionInfo(accessToken, proxyOptions);
      projectId = normalizeCloudCodeProjectId(subInfo?.cloudaicompanionProject);
      plan = subInfo?.currentTier?.name || plan;
    }

    if (!projectId) {
      return {
        plan,
        message: "Gemini CLI project ID not available. Reconnect Gemini CLI, or configure a Google Cloud project with Gemini Code Assist access before checking quota.",
      };
    }

    const response = await fetchWithTimeout(
      U("gemini-cli").quotaUrl,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project: projectId }),
      },
      10000,
      proxyOptions
    );

    if (!response.ok) {
      return { plan, message: "Gemini CLI quota error (" + response.status + ")." };
    }

    const data = await response.json();
    const quotas = {};

    if (Array.isArray(data.buckets)) {
      for (const bucket of data.buckets) {
        if (!bucket.modelId || bucket.remainingFraction == null) continue;

        const remainingFraction = Number(bucket.remainingFraction) || 0;
        const total = 1000;
        const remaining = Math.round(total * remainingFraction);
        const used = Math.max(0, total - remaining);

        quotas[bucket.modelId] = {
          used,
          total,
          resetAt: parseResetTime(bucket.resetTime),
          remainingPercentage: remainingFraction * 100,
          unlimited: false,
        };
      }
    }

    return { plan, quotas };
  } catch (error) {
    return { message: "Gemini CLI error: " + error.message };
  }
}

/**
 * Get Gemini CLI subscription info via loadCodeAssist
 */
async function getGeminiSubscriptionInfo(accessToken, proxyOptions = null) {
  try {
    const response = await fetchWithTimeout(
      U("gemini-cli").loadCodeAssistUrl,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metadata: CLIENT_METADATA }),
      },
      10000,
      proxyOptions
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Antigravity Usage - Fetch quota from Google Cloud Code API
 */
export async function getAntigravityUsage(accessToken, providerSpecificData, proxyOptions = null) {
  try {
    const subscriptionInfo = await getAntigravitySubscriptionInfo(accessToken, proxyOptions);
    const projectId = subscriptionInfo?.cloudaicompanionProject || null;
    const plan = resolvePlanName(subscriptionInfo);

    const candidateUrls = [
      ANTIGRAVITY_CONFIG.quotaApiUrl,
      ...ANTIGRAVITY_QUOTA_SUMMARY_URLS.filter((u) => u !== ANTIGRAVITY_CONFIG.quotaApiUrl),
    ];

    let lastError = null;
    let quotaData = null;
    let serverTimeOffsetMs = null;

    for (const url of candidateUrls) {
      try {
        const response = await fetchWithTimeout(url, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + accessToken,
            "User-Agent": ANTIGRAVITY_CONFIG.userAgent,
            "Content-Type": "application/json",
            "X-Client-Name": "antigravity",
            "X-Client-Version": ANTIGRAVITY_IDE_VERSION,
          },
          body: JSON.stringify({
            ...(projectId ? { project: projectId } : {}),
          }),
        }, 10000, proxyOptions);

        if (response.status === 403) {
          return {
            plan,
            message: "Antigravity quota API access forbidden. Chat may still work.",
            groups: [],
            quotas: {},
            subscriptionInfo,
          };
        }

        if (response.status === 401) {
          return {
            plan,
            message: "Antigravity quota API authentication expired. Chat may still work.",
            groups: [],
            quotas: {},
            subscriptionInfo,
          };
        }

        if (response.ok) {
          const dateHeader = response.headers?.get?.("date");
          if (dateHeader) {
            const serverMs = new Date(dateHeader).getTime();
            if (Number.isFinite(serverMs)) {
              serverTimeOffsetMs = serverMs - Date.now();
            }
          }
          quotaData = await response.json();
          break;
        } else {
          lastError = new Error("Antigravity API error: " + response.status);
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!quotaData) {
      if (lastError) throw lastError;
      throw new Error("Failed to retrieve Antigravity quota from all endpoints");
    }

    const { groups, quotas } = parseQuotaSummaryData(quotaData);

    return {
      plan,
      groups,
      quotas,
      subscriptionInfo,
      serverTimeOffsetMs,
    };
  } catch (error) {
    console.error("[Antigravity Usage] Error:", error.message, error.cause);
    return {
      message: "Antigravity error: " + error.message,
      groups: [],
      quotas: {},
    };
  }
}

/**
 * Get Antigravity subscription info
 */
async function getAntigravitySubscriptionInfo(accessToken, proxyOptions = null) {
  try {
    const response = await fetchWithTimeout(ANTIGRAVITY_CONFIG.loadProjectApiUrl, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "User-Agent": ANTIGRAVITY_CONFIG.userAgent,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ metadata: CLIENT_METADATA, mode: 1 }),
    }, 10000, proxyOptions);

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("[Antigravity Subscription] Error:", error.message);
    return null;
  }
}
