import assert from "node:assert/strict";
import test from "node:test";
import { buildCodexModelsResponse, formatDisplayName, getAvailableCodexCandidates } from "../../open-sse/services/codexModels.js";

test("formatDisplayName correctly handles dots, hyphens, and acronyms", () => {
  assert.equal(formatDisplayName("gemini-3.7-flash"), "Gemini 3.7 Flash");
  assert.equal(formatDisplayName("gemini-3.7-flash-thinking"), "Gemini 3.7 Flash Thinking");
  assert.equal(formatDisplayName("mimo-v2.5"), "Mimo V2.5");
  assert.equal(formatDisplayName("gemini-cli"), "Gemini CLI");
  assert.equal(formatDisplayName("claude-3-7-sonnet-20250219"), "Claude 3.7 Sonnet 20250219");
  assert.equal(formatDisplayName("claude-3-5-haiku"), "Claude 3.5 Haiku");
  assert.equal(formatDisplayName("deepseek-v3.2"), "DeepSeek V3.2");
  assert.equal(formatDisplayName("deepseek-r1"), "DeepSeek R1");
  assert.equal(formatDisplayName("qwen-2.5-coder-32b-instruct"), "Qwen 2.5 Coder 32B Instruct");
  assert.equal(formatDisplayName("llama-3.3-70b-instruct"), "Llama 3.3 70B Instruct");
  assert.equal(formatDisplayName("kimi-k1.5"), "Kimi K1.5");
  assert.equal(formatDisplayName("minimax-m3"), "MiniMax M3");
  assert.equal(formatDisplayName("antigravity/gemini-3-flash-agent"), "Gemini 3 Flash Agent");
  assert.equal(formatDisplayName("custom-slug", "Explicit Name"), "Explicit Name");
});

test("buildCodexModelsResponse returns clean deduplicated Codex catalog", () => {
  const mockModels = [
    { id: "gpt-5.6-sol", owned_by: "cx" },
    { id: "cx/gpt-5.6-sol", owned_by: "cx" },
    { id: "aihub/gpt-5.6-sol", owned_by: "aihub" },
    { id: "tokenrouter/openai/gpt-5.6-sol", owned_by: "tokenrouter" },
    { id: "claude-opus-4.6", owned_by: "combo" },
    { id: "gh/claude-sonnet-4.6", owned_by: "gh", capabilities: { vision: true, reasoning: true } },
    { id: "gc/gemini-2.5-flash", owned_by: "gc", capabilities: { vision: true, reasoning: true } },
    { id: "gc/gemini-3.7-flash", owned_by: "gc", capabilities: { vision: true, reasoning: true } },
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

  // Verify combo is present and has vision enabled by default
  const combo = result.models.find((m) => m.slug === "claude-opus-4.6");
  assert.ok(combo, "Combo claude-opus-4.6 should be preserved");
  assert.deepEqual(combo.input_modalities, ["text", "image"], "Combo should support vision/image input");
  assert.equal(combo.supports_image_detail_original, true, "Combo should support image detail original");

  // Verify primary provider models
  const sonnet = result.models.find((m) => m.slug.includes("claude-sonnet-4.6"));
  assert.ok(sonnet, "Claude Sonnet 4.6 should be present");
  assert.equal(sonnet.display_name, "Claude Sonnet 4.6 (Thinking)");

  // Verify formatted dynamic model preserves version dots
  const geminiFlash = result.models.find((m) => m.slug.includes("gemini-3.7-flash"));
  assert.ok(geminiFlash, "Gemini 3.7 Flash should be present");
  assert.equal(geminiFlash.display_name, "Gemini 3.7 Flash");
});

test("buildCodexModelsResponse handles custom whitelist and custom display names", () => {
  const mockModels = [
    { id: "gpt-5.6-sol", owned_by: "cx" },
    { id: "claude-opus-4.6", owned_by: "combo" },
    { id: "antigravity/gemini-3-flash-agent", owned_by: "antigravity", capabilities: { vision: true, reasoning: true } },
    { id: "deepseek/deepseek-v3", owned_by: "deepseek" },
    { id: "extra/unused-model", owned_by: "extra" },
  ];

  const userConfig = {
    mode: "custom",
    selectedModelIds: [
      "antigravity/gemini-3-flash-agent",
      "claude-opus-4.6",
      "deepseek/deepseek-v3",
    ],
    customDisplayNames: {
      "antigravity/gemini-3-flash-agent": "My Primary Gemini Flash",
    },
  };

  const result = buildCodexModelsResponse(mockModels, userConfig);
  assert.ok(result && Array.isArray(result.models));
  assert.equal(result.models.length, 3, "Should strictly return 3 selected models");

  assert.equal(result.models[0].slug, "antigravity/gemini-3-flash-agent");
  assert.equal(result.models[0].display_name, "My Primary Gemini Flash");
  assert.equal(result.models[0].priority, 1);
  assert.deepEqual(result.models[0].input_modalities, ["text", "image"]);

  assert.equal(result.models[1].slug, "claude-opus-4.6");
  assert.equal(result.models[1].priority, 2);
  assert.deepEqual(result.models[1].input_modalities, ["text", "image"]);

  assert.equal(result.models[2].slug, "deepseek/deepseek-v3");
  assert.equal(result.models[2].priority, 3);
});

test("getAvailableCodexCandidates returns candidates with recommendedIds", () => {
  const mock = [{ id: "gpt-5.6-sol", owned_by: "cx" }, { id: "bge", kind: "embedding" }];
  const { candidates, recommendedIds } = getAvailableCodexCandidates(mock);
  assert.equal(candidates.some(c => c.id === "bge"), false);
  assert.ok(recommendedIds.includes("gpt-5.6-sol"));
});
