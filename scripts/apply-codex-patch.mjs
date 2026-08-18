#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const CODEX_MODELS_PATH = path.join(ROOT_DIR, "open-sse", "services", "codexModels.js");
const ROUTE_PATH = path.join(ROOT_DIR, "src", "app", "api", "v1", "models", "route.js");
const PATCH_DIR = path.join(ROOT_DIR, "patches");
const PATCH_FILE = path.join(PATCH_DIR, "codex-client-models.patch");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");

const CODEX_MODELS_CONTENT = "/**\n * Codex Client Models Catalog Builder with Smart Deduplication and Clean Filtering\n */\n\nconst REASONING_DESCRIPTIONS = {\n  none: \"No reasoning\",\n  minimal: \"Fastest responses with minimal reasoning\",\n  low: \"Fast responses with lighter reasoning\",\n  medium: \"Balances speed and reasoning depth for everyday tasks\",\n  high: \"Greater reasoning depth for complex problems\",\n  xhigh: \"Extra high reasoning depth for complex problems\",\n  max: \"Maximum available reasoning depth for complex problems\",\n  ultra: \"Ultimate reasoning depth for the hardest tasks\",\n};\n\nconst BASE_CODEX_TEMPLATE = {\n  prefer_websockets: false,\n  support_verbosity: true,\n  default_verbosity: \"low\",\n  apply_patch_tool_type: \"freeform\",\n  web_search_tool_type: \"text_and_image\",\n  input_modalities: [\"text\", \"image\"],\n  supports_image_detail_original: true,\n  truncation_policy: {\n    mode: \"tokens\",\n    limit: 10000,\n  },\n  supports_parallel_tool_calls: true,\n  tool_mode: null,\n  multi_agent_version: null,\n  use_responses_lite: false,\n  include_skills_usage_instructions: true,\n  include_apps_usage_instructions: true,\n  include_plugin_usage_instructions: true,\n  node_repl_auto_review_required: false,\n  node_repl_disabled: false,\n  auto_review_model_override: null,\n  model_specialty: null,\n  context_window: 200000,\n  max_context_window: 200000,\n  auto_compact_token_limit: null,\n  comp_hash: \"2911\",\n  default_reasoning_summary: \"none\",\n  supports_reasoning_summary_parameter: true,\n  shell_type: \"shell_command\",\n  visibility: \"list\",\n  minimal_client_version: \"0.124.0\",\n  supported_in_api: true,\n  availability_nux: null,\n  upgrade: null,\n  priority: 100,\n  additional_speed_tiers: [],\n  service_tiers: [],\n  default_service_tier: null,\n  experimental_supported_tools: [],\n  model_messages: null,\n  base_instructions: \"You are Codex, a coding agent based on GPT-5. You and the user share one workspace, and your job is to collaborate with them until their goal is genuinely handled.\",\n};\n\nconst CANONICAL_TEMPLATES = {\n  \"gpt-5.6-sol\": {\n    display_name: \"GPT-5.6-Sol\",\n    description: \"Latest frontier agentic coding model.\",\n    priority: 1,\n    context_window: 372000,\n    max_context_window: 372000,\n    default_reasoning_level: \"low\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n      { effort: \"max\", description: REASONING_DESCRIPTIONS.max },\n      { effort: \"ultra\", description: REASONING_DESCRIPTIONS.ultra },\n    ],\n  },\n  \"gpt-5.6-terra\": {\n    display_name: \"GPT-5.6-Terra\",\n    description: \"High-throughput frontier model.\",\n    priority: 2,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.6-luna\": {\n    display_name: \"GPT-5.6-Luna\",\n    description: \"Fast, cost-effective frontier model.\",\n    priority: 3,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.5\": {\n    display_name: \"GPT-5.5\",\n    description: \"Frontier model for complex coding, research, and real-world work.\",\n    priority: 7,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.4\": {\n    display_name: \"GPT-5.4\",\n    description: \"Flagship intelligence for reasoning and coding.\",\n    priority: 16,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.4-mini\": {\n    display_name: \"GPT-5.4-Mini\",\n    description: \"Smaller, faster model for reasoning tasks.\",\n    priority: 23,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.3-codex-spark\": {\n    display_name: \"GPT-5.3-Codex-Spark\",\n    description: \"Specialized model optimized for rapid coding loops.\",\n    priority: 26,\n    context_window: 128000,\n    max_context_window: 128000,\n    default_reasoning_level: \"low\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n    ],\n  },\n  \"claude-opus-4.6\": {\n    display_name: \"Claude Opus 4.6 (Thinking)\",\n    description: \"Anthropic flagship reasoning model.\",\n    priority: 30,\n    context_window: 1000000,\n    max_context_window: 1000000,\n    max_tokens: 128000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"claude-sonnet-4.6\": {\n    display_name: \"Claude Sonnet 4.6 (Thinking)\",\n    description: \"Anthropic high-performance reasoning & coding model.\",\n    priority: 31,\n    context_window: 1000000,\n    max_context_window: 1000000,\n    max_tokens: 128000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gemini-3.1-pro\": {\n    display_name: \"Gemini 3.1 Pro (High)\",\n    description: \"Google frontier multimodal reasoning model.\",\n    priority: 35,\n    context_window: 1048576,\n    max_context_window: 1048576,\n    max_tokens: 65535,\n    default_reasoning_level: \"high\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n    ],\n  },\n  \"gemini-2.5-flash\": {\n    display_name: \"Gemini 2.5 Flash\",\n    description: \"Google high-speed multimodal model.\",\n    priority: 36,\n    context_window: 1048576,\n    max_context_window: 1048576,\n    max_tokens: 65536,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n    ],\n  },\n  \"gemini-3.1-flash-lite\": {\n    display_name: \"Gemini 3.1 Flash Lite\",\n    description: \"Google ultra-fast multimodal model.\",\n    priority: 37,\n    context_window: 1048576,\n    max_context_window: 1048576,\n    max_tokens: 65536,\n    default_reasoning_level: \"low\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n    ],\n  },\n  \"deepseek-v4-pro\": {\n    display_name: \"DeepSeek V4 Pro\",\n    description: \"DeepSeek flagship coding and reasoning model.\",\n    priority: 40,\n    context_window: 1000000,\n    max_context_window: 1000000,\n    max_tokens: 65536,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"minimax-m3\": {\n    display_name: \"MiniMax M3\",\n    description: \"MiniMax advanced multimodal reasoning model.\",\n    priority: 42,\n    context_window: 512000,\n    max_context_window: 512000,\n    max_tokens: 131072,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n    ],\n  },\n  \"codex-auto-review\": {\n    display_name: \"Codex Auto Review\",\n    description: \"Specialized model for automatic code review.\",\n    priority: 45,\n    context_window: 128000,\n    max_context_window: 128000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n    ],\n  },\n};\n\nconst PRIMARY_PROVIDERS = new Set([\n  \"combo\", \"cx\", \"codex\", \"gh\", \"github\", \"gc\", \"gemini-cli\", \"gemini\",\n  \"antigravity\", \"kiro\", \"kr\", \"deepseek\", \"glm\", \"glm-cn\", \"minimax\", \"minimax-cn\",\n  \"xai\", \"grok-cli\", \"codebuddy-cn\", \"qoder\", \"cursor\", \"kimchi\", \"nvidia\",\n]);\n\nconst PROVIDER_PRIORITY_MAP = {\n  combo: 0, cx: 1, codex: 1, gh: 2, github: 2, gc: 3, antigravity: 3, gemini: 3,\n  kiro: 4, kr: 4, deepseek: 5, nvidia: 6, glm: 7, \"glm-cn\": 7, minimax: 8, \"minimax-cn\": 8,\n  \"codebuddy-cn\": 9, qoder: 10, cursor: 11, kimchi: 12, \"grok-cli\": 13, xai: 13,\n};\n\nexport function formatDisplayName(slug, explicitName) {\n  if (explicitName && explicitName.trim() !== \"\" && explicitName !== slug) {\n    return explicitName.trim();\n  }\n  const baseName = slug.includes(\"/\") ? slug.split(\"/\").pop() : slug;\n  return baseName\n    .replace(/(?<=[a-z])-(\\d+)-(\\d+)(?=[-_]|$)/gi, \"-$1.$2\")\n    .replace(/(?<!\\d)\\.|\\.(?!\\d)|[-_]+/g, \" \")\n    .replace(/\\b[a-z]/g, (char) => char.toUpperCase())\n    .replace(/\\b([vr])(?=\\d)/gi, (m, p1) => p1.toUpperCase())\n    .replace(/\\b(\\d+)([bkmt])\\b/gi, (m, num, unit) => `${num}${unit.toUpperCase()}`)\n    .replace(/\\b(Gpt|Ai|Oss|Tts|Stt|Llm|Cli|Glm|Api)\\b/gi, (m) => m.toUpperCase())\n    .replace(/\\bDeepseek\\b/gi, \"DeepSeek\")\n    .replace(/\\bMinimax\\b/gi, \"MiniMax\")\n    .replace(/\\s+/g, \" \")\n    .trim();\n}\n\nfunction shouldExcludeModel(slug, kind) {\n  if (kind && kind !== \"llm\" && kind !== \"imageToText\" && kind !== \"combo\") {\n    return true;\n  }\n  const lower = String(slug).toLowerCase();\n  if (\n    /embed|rerank|asr|tts|stt|speech|audio|parakeet|whisper|flux|dall-?e|sdxl|sd-|stable-diffusion|recraft|ideogram/i.test(\n      lower\n    )\n  ) {\n    if (!/claude|gpt-5|gpt-4|gemini|deepseek|qwen|glm|kimi|minimax/i.test(lower) || /gpt-image|imagine/i.test(lower)) {\n      return true;\n    }\n  }\n  if (/:free/i.test(lower) || /-review$/i.test(lower)) {\n    return true;\n  }\n  if (/copilot-search-|exec-agent-|mai-code-|goldeneye-/i.test(lower)) {\n    return true;\n  }\n  return false;\n}\n\nfunction getBaseKey(slug) {\n  const parts = slug.split(\"/\");\n  let base = parts[parts.length - 1];\n  if (base.endsWith(\"-review\")) {\n    base = base.slice(0, -7);\n  }\n  return base.toLowerCase();\n}\n\nexport function buildCodexModelsResponse(models = []) {\n  const isCombo = (m) => m.owned_by === \"combo\" || m.kind === \"combo\";\n\n  const modelCandidates = new Map();\n\n  for (const raw of models) {\n    if (!raw || !raw.id) continue;\n    const slug = String(raw.id).trim();\n    if (!slug) continue;\n    if (shouldExcludeModel(slug, raw.kind)) continue;\n\n    const provider = slug.includes(\"/\")\n      ? slug.split(\"/\")[0].toLowerCase()\n      : isCombo(raw)\n      ? \"combo\"\n      : (raw.owned_by || \"other\").toLowerCase();\n\n    if (!PRIMARY_PROVIDERS.has(provider) && !isCombo(raw)) {\n      continue;\n    }\n\n    const baseKey = isCombo(raw) ? slug.toLowerCase() : getBaseKey(slug);\n    const providerRank = PROVIDER_PRIORITY_MAP[provider] ?? 20;\n\n    const existing = modelCandidates.get(baseKey);\n    if (!existing || providerRank < existing.rank) {\n      modelCandidates.set(baseKey, { rank: providerRank, raw });\n    }\n  }\n\n  const result = [];\n  const nonTemplateItems = [];\n\n  for (const { raw } of modelCandidates.values()) {\n    const slug = String(raw.id).trim();\n    const baseSlug = slug.includes(\"/\") ? slug.split(\"/\").pop() : slug;\n    const template =\n      CANONICAL_TEMPLATES[slug] ||\n      CANONICAL_TEMPLATES[baseSlug] ||\n      CANONICAL_TEMPLATES[getBaseKey(slug)];\n\n    const caps = raw.capabilities || {};\n    const hasVision = caps.vision === true || raw.kind === \"imageToText\" || isCombo(raw);\n    const hasReasoning = caps.reasoning === true || template?.supported_reasoning_levels?.length > 1;\n    const contextWindow =\n      Number(raw.context_length) ||\n      Number(caps.contextWindow) ||\n      template?.context_window ||\n      BASE_CODEX_TEMPLATE.context_window;\n    const maxTokens =\n      Number(raw.max_completion_tokens) ||\n      Number(caps.maxOutput) ||\n      template?.max_tokens ||\n      64000;\n\n    const displayName =\n      raw.display_name ||\n      template?.display_name ||\n      formatDisplayName(slug, raw.name);\n    const description = raw.description || template?.description || displayName;\n\n    const modelEntry = {\n      ...BASE_CODEX_TEMPLATE,\n      slug,\n      display_name: displayName,\n      description,\n      visibility: \"list\",\n      context_window: contextWindow,\n      max_context_window: contextWindow,\n      max_tokens: maxTokens,\n      input_modalities: hasVision ? [\"text\", \"image\"] : [\"text\"],\n      supports_image_detail_original: hasVision,\n      supports_parallel_tool_calls: caps.tools !== false,\n      supports_search_tool: caps.search === true || Boolean(template?.supports_search_tool),\n      experimental_supported_tools: [],\n      additional_speed_tiers: [],\n      service_tiers: [],\n      default_service_tier: null,\n      supports_reasoning_summary_parameter: true,\n      model_messages: null,\n    };\n\n    if (template) {\n      modelEntry.priority = template.priority;\n      modelEntry.default_reasoning_level = template.default_reasoning_level;\n      modelEntry.supported_reasoning_levels = template.supported_reasoning_levels;\n    } else if (isCombo(raw)) {\n      modelEntry.priority = 10;\n      modelEntry.supported_reasoning_levels = [\n        { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n        { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n        { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n        { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n      ];\n      modelEntry.default_reasoning_level = \"medium\";\n    } else {\n      if (hasReasoning) {\n        modelEntry.supported_reasoning_levels = [\n          { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n          { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n          { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n          { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n        ];\n        modelEntry.default_reasoning_level = \"medium\";\n      } else {\n        modelEntry.supported_reasoning_levels = [\n          { effort: \"none\", description: REASONING_DESCRIPTIONS.none },\n        ];\n        modelEntry.default_reasoning_level = \"none\";\n      }\n      nonTemplateItems.push(modelEntry);\n    }\n\n    result.push(modelEntry);\n  }\n\n  nonTemplateItems.sort((a, b) => {\n    const nameA = (a.display_name || a.slug).toLowerCase();\n    const nameB = (b.display_name || b.slug).toLowerCase();\n    if (nameA === nameB) return a.slug.localeCompare(b.slug);\n    return nameA.localeCompare(nameB);\n  });\n\n  nonTemplateItems.forEach((entry, idx) => {\n    entry.priority = 50 + (idx + 1) * 2;\n  });\n\n  result.sort((a, b) => (a.priority || 100) - (b.priority || 100));\n\n  return { models: result };\n}\n\nexport default { buildCodexModelsResponse, formatDisplayName };\n";
const PATCH_DIFF = `--- a/src/app/api/v1/models/route.js
+++ b/src/app/api/v1/models/route.js
@@ -14,2 +14,3 @@
 import { capabilitiesFromServiceKind, getCapabilitiesForModel } from "open-sse/providers/capabilities.js";
+import { buildCodexModelsResponse } from "open-sse/services/codexModels.js";
 
@@ -370,2 +371,9 @@
     const data = await buildModelsList([LLM_KIND], { skipDynamicFetch });
+
+    // Handle Codex CLI / Codex App models discovery request
+    const url = new URL(request?.url || "http://localhost", "http://localhost");
+    if (url.searchParams.has("client_version") || request?.nextUrl?.searchParams?.has("client_version")) {
+      return Response.json(buildCodexModelsResponse(data), {
+        headers: { "Access-Control-Allow-Origin": "*" },
+      });
+    }
+
     return Response.json({ object: "list", data }, {
`;
export function applyPatch() {
  console.log("Applying 9router Codex client_version patch...");

  fs.mkdirSync(path.dirname(CODEX_MODELS_PATH), { recursive: true });
  fs.writeFileSync(CODEX_MODELS_PATH, CODEX_MODELS_CONTENT, "utf8");
  console.log("  [+] Created/Updated open-sse/services/codexModels.js");

  fs.mkdirSync(PATCH_DIR, { recursive: true });
  fs.writeFileSync(PATCH_FILE, PATCH_DIFF, "utf8");
  console.log("  [+] Created patches/codex-client-models.patch");

  if (!fs.existsSync(ROUTE_PATH)) {
    console.error("  [!] Error: " + ROUTE_PATH + " not found.");
    process.exit(1);
  }
  let routeContent = fs.readFileSync(ROUTE_PATH, "utf8");
  if (routeContent.includes("buildCodexModelsResponse")) {
    console.log("  [*] src/app/api/v1/models/route.js is already patched.");
  } else {
    const importAnchor = 'import { capabilitiesFromServiceKind, getCapabilitiesForModel } from "open-sse/providers/capabilities.js";';
    const importCode = 'import { capabilitiesFromServiceKind, getCapabilitiesForModel } from "open-sse/providers/capabilities.js";\nimport { buildCodexModelsResponse } from "open-sse/services/codexModels.js";';
    if (routeContent.includes(importAnchor)) {
      routeContent = routeContent.replace(importAnchor, importCode);
    } else {
      routeContent = 'import { buildCodexModelsResponse } from "open-sse/services/codexModels.js";\n' + routeContent;
    }

    const branchAnchor = 'const data = await buildModelsList([LLM_KIND], { skipDynamicFetch });';
    const branchCode = `const data = await buildModelsList([LLM_KIND], { skipDynamicFetch });

    // Handle Codex CLI / Codex App models discovery request
    const url = new URL(request?.url || "http://localhost", "http://localhost");
    if (url.searchParams.has("client_version") || request?.nextUrl?.searchParams?.has("client_version")) {
      return Response.json(buildCodexModelsResponse(data), {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }`;
    if (routeContent.includes(branchAnchor)) {
      routeContent = routeContent.replace(branchAnchor, branchCode);
      fs.writeFileSync(ROUTE_PATH, routeContent, "utf8");
      console.log("  [+] Patched src/app/api/v1/models/route.js");
    } else {
      console.error("  [!] Could not locate insertion anchor in route.js");
      process.exit(1);
    }
  }

  if (fs.existsSync(PACKAGE_JSON_PATH)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
      pkg.scripts = pkg.scripts || {};
      if (!pkg.scripts["patch:codex"]) {
        pkg.scripts["patch:codex"] = "node scripts/apply-codex-patch.mjs";
        fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf8");
        console.log("  [+] Added 'patch:codex' script to package.json");
      }
    } catch {} 
  }

  console.log("Done! Codex client catalog support is active.");
}
export function revertPatch() {
  console.log("Reverting 9router Codex client_version patch...");

  if (fs.existsSync(ROUTE_PATH)) {
    let routeContent = fs.readFileSync(ROUTE_PATH, "utf8");
    routeContent = routeContent.replace('import { buildCodexModelsResponse } from "open-sse/services/codexModels.js";\n', "");
    routeContent = routeContent.replace('import { buildCodexModelsResponse } from "open-sse/services/codexModels.js";', "");
    const branchRegex = /\n\s*\/\/ Handle Codex CLI \/ Codex App models discovery request[\ls\S]*?return Response\.json\(buildCodexModelsResponse\(data\),[s\S]*?\}\);\s*\}/;
    routeContent = routeContent.replace(branchRegex, "");
    fs.writeFileSync(ROUTE_PATH, routeContent, "utf8");
    console.log("  [-] Reverted src/app/api/v1/models/route.js");
  }

  if (fs.existsSync(CODEX_MODELS_PATH)) {
    fs.unlinkSync(CODEX_MODELS_PATH);
    console.log("  [-] Removed open-sse/services/codexModels.js");
  }

  console.log("Revert complete.");
}
export function checkPatch() {
  const hasService = fs.existsSync(CODEX_MODELS_PATH);
  let hasRoutePatch = false;
  if (fs.existsSync(ROUTE_PATH)) {
    const routeContent = fs.readFileSync(ROUTE_PATH, "utf8");
    hasRoutePatch = routeContent.includes("buildCodexModelsResponse");
  }

  console.log("9router Codex Patch Status:");
  console.log("  open-sse/services/codexModels.js :", hasService ? "PRESENT" : "MISSING");
  console.log("  src/app/api/v1/models/route.js  :", hasRoutePatch ? "PATCHED" : "UNPATCHED");

  if (hasService && hasRoutePatch) {
    console.log("  => Status: FULLY ACTIVE");
    return true;
  } else {
    console.log("  => Status: INACTIVE OR INCOMPLETE");
    return false;
  }
}

if (process.argv[1] && process.argv[1].endsWith("apply-codex-patch.mjs")) {
  const arg = process.argv[2];
  if (arg === "--revert") {
    revertPatch();
  } else if (arg === "--check") {
    const ok = checkPatch();
    process.exit(ok ? 0 : 1);
  } else {
    applyPatch();
  }
}