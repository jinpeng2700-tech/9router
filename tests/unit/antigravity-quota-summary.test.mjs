import assert from "node:assert/strict";
import test from "node:test";
import { parseQuotaData, getConnectionQuotaRemaining, formatResetTime } from "../../src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js";

test("parseQuotaData parses Antigravity retrieveUserQuotaSummary groups and ensures 5-hour limit is sorted above weekly limit", () => {
  // Pass weekly first to verify sort orders 5h before weekly
  const mockSummaryPayload = {
    groups: [
      {
        displayName: "GEMINI Models",
        description: "Models within this group: Gemini Flash, Gemini Pro",
        buckets: [
          {
            displayName: "Weekly Limit Remaining",
            remainingFraction: 0.61,
            resetTime: "2026-08-20T03:50:00Z",
            window: "weekly",
          },
          {
            displayName: "Five Hour Limit Remaining",
            remainingFraction: 0.9,
            resetTime: "2026-08-19T14:49:00Z",
            window: "5h",
          },
        ],
      },
      {
        displayName: "CLAUDE and GPT Models",
        description: "Models within this group: Claude Opus, Claude Sonnet, GPT-OSS",
        buckets: [
          {
            displayName: "Weekly Limit Remaining",
            remainingFraction: 1.0,
            resetTime: "2026-08-26T14:00:00Z",
            window: "weekly",
          },
          {
            displayName: "Five Hour Limit Remaining",
            remainingFraction: 1.0,
            resetTime: "2026-08-19T16:57:00Z",
            window: "5h",
          },
        ],
      },
    ],
  };

  const parsed = parseQuotaData("antigravity", mockSummaryPayload);
  assert.equal(parsed.length, 4);

  // Group 1 checks (Gemini): 5h must be first, weekly must be second
  assert.equal(parsed[0].displayName, "Five Hour Limit Remaining", "5h limit must be on top");
  assert.equal(parsed[0].remainingPercentage, 90);
  assert.equal(parsed[1].displayName, "Weekly Limit Remaining", "Weekly limit must be below");
  assert.equal(parsed[1].remainingPercentage, 61);

  // Group 2 checks (Claude/GPT): 5h must be first, weekly must be second
  assert.equal(parsed[2].displayName, "Five Hour Limit Remaining", "5h limit must be on top");
  assert.equal(parsed[3].displayName, "Weekly Limit Remaining", "Weekly limit must be below");

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
