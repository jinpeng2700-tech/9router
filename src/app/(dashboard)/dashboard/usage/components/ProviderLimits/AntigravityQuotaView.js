"use client";

import { useEffect, useState } from "react";
import { translate } from "@/i18n/runtime";

function formatDuration(deltaMs) {
  const totalMinutes = Math.max(1, Math.ceil(deltaMs / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0
      ? translate("{days}d {hours}h").replace("{days}", String(days)).replace("{hours}", String(hours))
      : translate("{days}d").replace("{days}", String(days));
  }
  if (hours > 0) {
    return minutes > 0
      ? translate("{hours}h {minutes}m").replace("{hours}", String(hours)).replace("{minutes}", String(minutes))
      : translate("{hours}h").replace("{hours}", String(hours));
  }
  if (minutes > 0) {
    return translate("{minutes}m").replace("{minutes}", String(minutes));
  }
  return translate("<1m");
}

function formatCountdown(resetTime, nowMs) {
  if (!resetTime) return null;
  const resetMs = new Date(resetTime).getTime();
  if (!Number.isFinite(resetMs)) return null;
  const deltaMs = resetMs - nowMs;
  if (deltaMs <= 0) return translate("Available");
  const dur = formatDuration(deltaMs);
  return translate("in {duration}").replace("{duration}", dur);
}

function translateGroupTitle(title) {
  if (!title) return "";
  const t = title.trim().toLowerCase();
  if (t.includes("gemini")) return translate("Gemini Models");
  if (t.includes("claude") || t.includes("gpt")) return translate("Claude and GPT Models");
  return translate(title);
}

function translateGroupDesc(desc) {
  if (!desc) return "";
  const match = desc.match(/^models within this group:\\s*(.+)$/i);
  if (match) {
    return translate("Models in this group: {models}").replace("{models}", match[1].trim());
  }
  return translate(desc);
}

function translateBucketLabel(label) {
  if (!label) return "";
  const t = label.trim().toLowerCase();
  if (t.includes("five") || t.includes("5") || t.includes("5h") || t.includes("5-hour")) {
    return translate("Five Hour Limit Remaining");
  }
  if (t.includes("week")) {
    return translate("Weekly Limit Remaining");
  }
  if (t.includes("day") || t.includes("daily")) {
    return translate("Daily Limit Remaining");
  }
  if (t.includes("month")) {
    return translate("Monthly Limit Remaining");
  }
  return translate(label);
}

function getMeterColor(percentage) {
  if (percentage > 70) {
    return {
      bar: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
    };
  }
  if (percentage >= 30) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  };
}

export default function AntigravityQuotaView({
  groups = [],
  serverTimeOffsetMs = 0,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now() + (Number(serverTimeOffsetMs) || 0));

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now() + (Number(serverTimeOffsetMs) || 0));
    }, 30000);
    return () => clearInterval(timer);
  }, [serverTimeOffsetMs]);

  if (!Array.isArray(groups) || groups.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-text-muted">
        {translate("No quota data available")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group, gIdx) => {
        const groupTitle = translateGroupTitle(group.displayName || group.label);
        const groupDesc = translateGroupDesc(group.description);
        const buckets = Array.isArray(group.buckets) ? group.buckets : [];

        return (
          <div
            key={group.id || gIdx}
            className="rounded-xl border border-black/5 bg-black/[0.02] p-3 transition-colors dark:border-white/5 dark:bg-white/[0.02]"
          >
            {/* Group Header */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                  {groupTitle}
                </span>
              </div>
              {groupDesc && (
                <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">
                  {groupDesc}
                </p>
              )}
            </div>


            {/* Buckets */}
            <div className="space-y-2.5">
              {buckets.map((bucket, bIdx) => { const fraction = bucket.remainingFraction != null
                  ? Math.max(0, Math.min(1, Number(bucket.remainingFraction)))
                  : 1;
                const percentage = Math.round(fraction * 100);
                const colors = getMeterColor(percentage);
                const bucketLabel = translateBucketLabel(bucket.displayName || bucket.label);
                const countdown = formatCountdown(bucket.resetTime || bucket.resetAt, nowMs);

                const isFull = fraction >= 1; 
                const percentLabel = isFull
                  ? translate("Quota Available")
                  : translate("Remaining {percent}%").replace("{percent}", String(percentage));

                return (
                  <div key={bucket.id || bIdx} className="space-y-1.5">
                    {/* Bucket Row Meta */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium text-text-primary">
                        {bucketLabel}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={"font-medium " + colors.text}>
                          {percentLabel}
                        </span>
                        {countdown && (
                          <span className="text-[11px] text-text-muted">
                            {countdown}
                          </span>
                        )}
                      </div>
                    </div>


                    {/* Progress Track */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                      <div
                        className={"h-full transition-all duration-300 " + colors.bar}
                        style={{ width: percentage + "%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
