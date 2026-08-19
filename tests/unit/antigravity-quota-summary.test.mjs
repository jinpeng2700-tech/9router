import assert from "node:assert/strict";
import test from "node:test";
import { parseQuotaData, getConnectionQuotaRemaining, formatResetTime } from "../../src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js";

test("parseQuotaData parses Antigravity retrieveUserQuotaSummary groups correctly", () => {
  const mockSummaryPayload = {
    groups: [
      {
        displayName: "GEMINI Models",
        description: "Models within this group: Gemini Flash, Gemini Pro",
        buckets: [
          {
            displayName: "Five Hour Limit Remaining",
            remainingFraction: 0.9,
            resetTime: "2026-08-19T14:49:00Z",
            window: "5h",
          },
          {
            displayName: "Weekly Limit Remaining",
            remainingFraction: 0.61,
            resetTime: "2026-08-20T03:50:00Z",
            window: "weekly",
          },
        ],
      },
      {
        displayName: "CLAUDE and GPT Models",
        description: "Models within this group: Claude Opus, Claude Sonnet, GPT-OSS",
        buckets: [
          {
            displayName: "Five Hour Limit Remaining",
            remainingFraction: 1.0,
            resetTime: "2026-08-19T16:57:00Z",
            window: "5h",
          },
          {
            displayName: "Weekly Limit Remaining",
            remainingFraction: 1.0,
            resetTime: "2026-08-26T14:00:00Z",
            window: "weekly",
          },
        ],
      },
    ],
  };

  const parsed = parseQuotaData("antigravity", mockSummaryPayload);
  assert.equal(parsed.length, 4);

  const gemini5h = parsed.find((q) => q.name.includes("GEMINI") && q.displayName.includes("Five Hour"));
  assert.ok(gemini5h);
  assert.equal(gemini5h.remainingPercentage, 90);
  assert.equal(gemini5h.remainingFraction, 0.9);
  assert.equal(gemini5h.used, 100);
  assert.equal(gemini5h.total, 1000);

  const geminiWeekly = parsed.find((q) => q.name.includes("GEMINI") && q.displayName.includes("Weekly"));
  assert.ok(geminiWeekly);
  assert.equal(geminiWeekly.remainingPercentage, 61);
  assert.equal(geminiWeekly.remainingFraction, 0.61);
  assert.equal(geminiWeekly.used, 390);

  const claude5h = parsed.find((q) => q.name.includes("CLAUDE") && q.displayName.includes("Five Hour"));
  assert.ok(claude5h);
  assert.equal(claude5h.remainingPercentage, 100);
  assert.equal(claude5h.remainingFraction, 1.0);
  assert.equal(claude5h.used, 0);

  const mockQuotaDataState = {
    "conn-1": {
      quotas: parsed,
      plan: "Pro",
    },
  };
  const minRemaining = getConnectionQuotaRemaining({ id: "conn-1" }, mockQuotaDataState);
  assert.equal(minRemaining, 61, "Should correctly pick 61% as lowest remaining bucket across groups");
});

test("parseQuotaData supports legacy models structure as fallback", () => {
  const mockLegacyPayload = {
    quotas: {
      "gemini-3.7-flash-high": {
        displayName: "Gemini 3.7 Flash (High)",
        used: 150,
        total: 1000,
        remainingPercentage: 85,
        resetAt: "2026-08-25T12:00:00Z",
      },
    },
  };

  const parsed = parseQuotaData("antigravity", mockLegacyPayload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, "Gemini 3.7 Flash (High)");
  assert.equal(parsed[0].remainingPercentage, 85);
});

test("formatResetTime formats countdown accurately", () => {
  const baseTime = Date.now();
  const in30Min = new Date(baseTime + 30 * 60 * 1000).toISOString();
  const in3Hours = new Date(baseTime + (3 * 60 + 15) * 60 * 1000).toISOString();
  const in2Days = new Date(baseTime + (2 * 24 + 5) * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString();

  assert.equal(formatResetTime(in30Min), "30m");
  assert.equal(formatResetTime(in3Hours), "3h 15m");
  assert.equal(formatResetTime(in2Days), "2d 5h 10m");
});
