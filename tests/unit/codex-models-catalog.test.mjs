import assert from "node:assert/strict";
import test from "node:test";
import { buildCodexModelsResponse } from "../../open-sse/services/codexModels.js";

test("buildCodexModelsResponse returns clean deduplicated Codex catalog", () => {
  const mockModels = [
    { id: "gpt-5.6-sol", owned_by: "cx" },
    { id: "cx/gpt-5.6-sol", owned_by: "cx" },
    { id: "aihub/gpt-5.6-sol", owned_by: "aihub" },
    { id: "tokenrouter/openai/gpt-5.6-sol", owned_by: "tokenrouter" },
    { id: "claude-opus-4.6", owned_by: "combo" },
    { id: "gh/claude-sonnet-4.6", owned_by: "gh", capabilities: { vision: true, reasoning: true } },
    { id: "gc/gemini-2.5-flash", owned_by: "gc", capabilities: { vision: true, reasoning: true } },
    { id: "siliconflowcn/bge-large-zh", owned_by: "siliconflowcn" },
    { id: "dall-e-3", kind: "image" },
  ];

  const result = buildCodexModelsResponse(mockModels);
  assert.ok(result && Array.isArray(result.models), "result should have models array");

  // Verify deduplication: gpt-5.6-sol should only appear ONCE
  const solList = result.models.filter((m) => m.slug.includes("gpt-5.6-sol"));
  assert.equal(solList.length, 1, "Duplicate gpt-5.6-sol variants should be deduplicated to 1");

  // Verify non-chat models like bge and dall-e-3 are filtered out
  assert.equal(result.models.some((m) => m.slug.includes("bge")), false, "Embeddings should be excluded");
  assert.equal(result.models.some((m) => m.slug.includes("dall-e")), false, "Image gen should be excluded");

  // Verify combo is present
  const combo = result.models.find((m) => m.slug === "claude-opus-4.6");
  assert.ok(combo, "Combo claude-opus-4.6 should be preserved");

  // Verify primary provider models
  const sonnet = result.models.find((m) => m.slug.includes("claude-sonnet-4.6"));
  assert.ok(sonnet, "Claude Sonnet 4.6 should be present");
  assert.equal(sonnet.display_name, "Claude Sonnet 4.6 (Thinking)");
});
