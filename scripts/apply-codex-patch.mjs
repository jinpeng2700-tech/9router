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

const CODEX_MODELS_CONTENT = "/**\n * Codex Client Models Catalog Builder\n * Converts 9router model definitions into the {\"models\": [...]} schema\n * required by the official Codex CLI and Codex App when requested with `client_version`.\n */\n\nconst REASONING_DESCRIPTIONS = {\n  none: \"No reasoning\",\n  minimal: \"Fastest responses with minimal reasoning\",\n  low: \"Fast responses with lighter reasoning\",\n  medium: \"Balances speed and reasoning depth for everyday tasks\",\n  high: \"Greater reasoning depth for complex problems\",\n  xhigh: \"Extra high reasoning depth for complex problems\",\n  max: \"Maximum available reasoning depth for complex problems\",\n  ultra: \"Ultimate reasoning depth for the hardest tasks\",\n};\n\nconst BASE_CODEX_TEMPLATE = {\n  prefer_websockets: false,\n  support_verbosity: true,\n  default_verbosity: \"low\",\n  apply_patch_tool_type: \"freeform\",\n  web_search_tool_type: \"text_and_image\",\n  input_modalities: [\"text\", \"image\"],\n  supports_image_detail_original: true,\n  truncation_policy: {\n    mode: \"tokens\",\n    limit: 10000,\n  },\n  supports_parallel_tool_calls: true,\n  tool_mode: null,\n  multi_agent_version: null,\n  use_responses_lite: false,\n  include_skills_usage_instructions: true,\n  include_apps_usage_instructions: true,\n  include_plugin_usage_instructions: true,\n  node_repl_auto_review_required: false,\n  node_repl_disabled: false,\n  auto_review_model_override: null,\n  model_specialty: null,\n  context_window: 200000,\n  max_context_window: 200000,\n  auto_compact_token_limit: null,\n  comp_hash: \"2911\",\n  default_reasoning_summary: \"none\",\n  shell_type: \"shell_command\",\n  visibility: \"list\",\n  minimal_client_version: \"0.124.0\",\n  supported_in_api: true,\n  availability_nux: null,\n  upgrade: null,\n  priority: 100,\n  base_instructions:\n    \"You are Codex, a coding agent based on GPT-5. You and the user share one workspace, and your job is to collaborate with them until their goal is genuinely handled.\",\n};\n\nconst CANONICAL_TEMPLATES = {\n  \"gpt-5.6-sol\": {\n    display_name: \"GPT-5.6-Sol\",\n    description: \"Latest frontier agentic coding model.\",\n    priority: 1,\n    context_window: 372000,\n    max_context_window: 372000,\n    default_reasoning_level: \"low\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n      { effort: \"max\", description: REASONING_DESCRIPTIONS.max },\n      { effort: \"ultra\", description: REASONING_DESCRIPTIONS.ultra },\n    ],\n  },\n  \"gpt-5.6-terra\": {\n    display_name: \"GPT-5.6-Terra\",\n    description: \"High-throughput frontier model.\",\n    priority: 2,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.6-luna\": {\n    display_name: \"GPT-5.6-Luna\",\n    description: \"Fast, cost-effective frontier model.\",\n    priority: 3,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.5\": {\n    display_name: \"GPT-5.5\",\n    description: \"Frontier model for complex coding, research, and real-world work.\",\n    priority: 7,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.4\": {\n    display_name: \"GPT-5.4\",\n    description: \"Flagship intelligence for reasoning and coding.\",\n    priority: 16,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.4-mini\": {\n    display_name: \"GPT-5.4-Mini\",\n    description: \"Smaller, faster model for reasoning tasks.\",\n    priority: 23,\n    context_window: 272000,\n    max_context_window: 272000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n      { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n    ],\n  },\n  \"gpt-5.3-codex-spark\": {\n    display_name: \"GPT-5.3-Codex-Spark\",\n    description: \"Specialized model optimized for rapid coding loops.\",\n    priority: 26,\n    context_window: 128000,\n    max_context_window: 128000,\n    default_reasoning_level: \"low\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n    ],\n  },\n  \"codex-auto-review\": {\n    display_name: \"Codex Auto Review\",\n    description: \"Specialized model for automatic code review.\",\n    priority: 43,\n    context_window: 128000,\n    max_context_window: 128000,\n    default_reasoning_level: \"medium\",\n    supported_reasoning_levels: [\n      { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n      { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n      { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n    ],\n  },\n};\n\nfunction formatDisplayName(slug, explicitName) {\n  if (explicitName && explicitName.trim() !== \"\" && explicitName !== slug) {\n    return explicitName.trim();\n  }\n  const baseName = slug.includes(\"/\") ? slug.split(\"/\").pop() : slug;\n  return baseName\n    .replace(/[-_.]+/g, \" \")\n    .replace(/\\b[a-z]/g, (char) => char.toUpperCase())\n    .replace(/\\b(Gpt|Ai|Oss|Tts|Stt|Llm)\\b/gi, (m) => m.toUpperCase())\n    .trim();\n}\n\nfunction shouldHideModel(slug, kind) {\n  if (kind && kind !== \"llm\" && kind !== \"imageToText\") {\n    return true;\n  }\n  const lower = String(slug).toLowerCase();\n  if (/image|imagen|dall-?e|flux|sdxl|sd-|video|speech|tts|stt|embed/i.test(lower)) {\n    if (!/claude|gpt-5|gpt-4|gemini|deepseek|qwen|glm|kimi/i.test(lower) || /gpt-image|imagine/i.test(lower)) {\n      return true;\n    }\n  }\n  return false;\n}\n\n/**\n * Build Codex Client models response from 9router models list.\n * @param {Array<object>} models - Raw models from buildModelsList\n * @returns {{ models: Array<object> }}\n */\nexport function buildCodexModelsResponse(models = []) {\n  const result = [];\n  const nonTemplateItems = [];\n\n  for (const raw of models) {\n    if (!raw || !raw.id) continue;\n    const slug = String(raw.id).trim();\n    if (!slug) continue;\n\n    const baseSlug = slug.includes(\"/\") ? slug.split(\"/\").pop() : slug;\n    const template = CANONICAL_TEMPLATES[slug] || CANONICAL_TEMPLATES[baseSlug];\n\n    const caps = raw.capabilities || {};\n    const hasVision = caps.vision === true || raw.kind === \"imageToText\";\n    const hasReasoning = caps.reasoning === true;\n    const contextWindow =\n      Number(raw.context_length) ||\n      Number(caps.contextWindow) ||\n      template?.context_window ||\n      BASE_CODEX_TEMPLATE.context_window;\n    const maxTokens =\n      Number(raw.max_completion_tokens) ||\n      Number(caps.maxOutput) ||\n      64000;\n\n    const displayName = raw.display_name || template?.display_name || formatDisplayName(slug, raw.name);\n    const description = raw.description || template?.description || displayName;\n    const hide = shouldHideModel(slug, raw.kind);\n\n    const modelEntry = {\n      ...BASE_CODEX_TEMPLATE,\n      slug,\n      display_name: displayName,\n      description,\n      visibility: hide ? \"hide\" : \"list\",\n      context_window: contextWindow,\n      max_context_window: contextWindow,\n      max_tokens: maxTokens,\n      input_modalities: hasVision ? [\"text\", \"image\"] : [\"text\"],\n      supports_image_detail_original: hasVision,\n      supports_parallel_tool_calls: caps.tools !== false,\n      supports_search_tool: caps.search === true,\n    };\n\n    if (template) {\n      modelEntry.priority = template.priority;\n      modelEntry.default_reasoning_level = template.default_reasoning_level;\n      modelEntry.supported_reasoning_levels = template.supported_reasoning_levels;\n    } else {\n      if (hasReasoning) {\n        modelEntry.supported_reasoning_levels = [\n          { effort: \"low\", description: REASONING_DESCRIPTIONS.low },\n          { effort: \"medium\", description: REASONING_DESCRIPTIONS.medium },\n          { effort: \"high\", description: REASONING_DESCRIPTIONS.high },\n          { effort: \"xhigh\", description: REASONING_DESCRIPTIONS.xhigh },\n        ];\n        modelEntry.default_reasoning_level = \"medium\";\n      } else {\n        modelEntry.supported_reasoning_levels = [\n          { effort: \"none\", description: REASONING_DESCRIPTIONS.none },\n        ];\n        modelEntry.default_reasoning_level = \"none\";\n      }\n      nonTemplateItems.push(modelEntry);\n    }\n\n    result.push(modelEntry);\n  }\n\n  // Sort non-template items alphabetically and assign priorities 100, 110, 120...\n  nonTemplateItems.sort((a, b) => {\n    const nameA = (a.display_name || a.slug).toLowerCase();\n    const nameB = (b.display_name || b.slug).toLowerCase();\n    if (nameA === nameB) return a.slug.localeCompare(b.slug);\n    return nameA.localeCompare(nameB);\n  });\n\n  nonTemplateItems.forEach((entry, idx) => {\n    entry.priority = 100 + (idx + 1) * 10;\n  });\n\n  // Sort full catalog by priority ascending\n  result.sort((a, b) => (a.priority || 100) - (b.priority || 100));\n\n  return { models: result };\n}\n";
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