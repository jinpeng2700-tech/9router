/**
 * Codex Client Models Catalog Builder with Smart Deduplication, Clean Filtering & Custom Whitelist Support
 */

const REASONING_DESCRIPTIONS = {
  none: "No reasoning",
  minimal: "Fastest responses with minimal reasoning",
  low: "Fast responses with lighter reasoning",
  medium: "Balances speed and reasoning depth for everyday tasks",
  high: "Greater reasoning depth for complex problems",
  xhigh: "Extra high reasoning depth for complex problems",
  max: "Maximum available reasoning depth for complex problems",
  ultra: "Ultimate reasoning depth for the hardest tasks",
};

const BASE_CODEX_TEMPLATE = {
  prefer_websockets: false,
  support_verbosity: true,
  default_verbosity: "low",
  apply_patch_tool_type: "freeform",
  web_search_tool_type: "text_and_image",
  input_modalities: ["text", "image"],
  supports_image_detail_original: true,
  truncation_policy: {
    mode: "tokens",
    limit: 10000,
  },
  supports_parallel_tool_calls: true,
  tool_mode: null,
  multi_agent_version: null,
  use_responses_lite: false,
  include_skills_usage_instructions: true,
  include_apps_usage_instructions: true,
  include_plugin_usage_instructions: true,
  node_repl_auto_review_required: false,
  node_repl_disabled: false,
  auto_review_model_override: null,
  model_specialty: null,
  context_window: 200000,
  max_context_window: 200000,
  auto_compact_token_limit: null,
  comp_hash: "2911",
  default_reasoning_summary: "none",
  supports_reasoning_summary_parameter: true,
  shell_type: "shell_command",
  visibility: "list",
  minimal_client_version: "0.124.0",
  supported_in_api: true,
  availability_nux: null,
  upgrade: null,
  priority: 100,
  additional_speed_tiers: [],
  service_tiers: [],
  default_service_tier: null,
  experimental_supported_tools: [],
  model_messages: null,
  base_instructions: "You are Codex, a coding agent based on GPT-5. You and the user share one workspace, and your job is to collaborate with them until their goal is genuinely handled.",
};

const CANONICAL_TEMPLATES = {
  "gpt-5.6-sol": {
    display_name: "GPT-5.6-Sol",
    description: "Latest frontier agentic coding model.",
    priority: 1,
    context_window: 372000,
    max_context_window: 372000,
    default_reasoning_level: "low",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
      { effort: "max", description: REASONING_DESCRIPTIONS.max },
      { effort: "ultra", description: REASONING_DESCRIPTIONS.ultra },
    ],
  },
  "gpt-5.6-terra": {
    display_name: "GPT-5.6-Terra",
    description: "High-throughput frontier model.",
    priority: 2,
    context_window: 272000,
    max_context_window: 272000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "gpt-5.6-luna": {
    display_name: "GPT-5.6-Luna",
    description: "Fast, cost-effective frontier model.",
    priority: 3,
    context_window: 272000,
    max_context_window: 272000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "gpt-5.5": {
    display_name: "GPT-5.5",
    description: "Frontier model for complex coding, research, and real-world work.",
    priority: 7,
    context_window: 272000,
    max_context_window: 272000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "gpt-5.4": {
    display_name: "GPT-5.4",
    description: "Flagship intelligence for reasoning and coding.",
    priority: 16,
    context_window: 272000,
    max_context_window: 272000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "gpt-5.4-mini": {
    display_name: "GPT-5.4-Mini",
    description: "Smaller, faster model for reasoning tasks.",
    priority: 23,
    context_window: 272000,
    max_context_window: 272000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "gpt-5.3-codex-spark": {
    display_name: "GPT-5.3-Codex-Spark",
    description: "Specialized model optimized for rapid coding loops.",
    priority: 26,
    context_window: 128000,
    max_context_window: 128000,
    default_reasoning_level: "low",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
    ],
  },
  "claude-opus-4.6": {
    display_name: "Claude Opus 4.6 (Thinking)",
    description: "Anthropic flagship reasoning model.",
    priority: 30,
    context_window: 1000000,
    max_context_window: 1000000,
    max_tokens: 128000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "claude-sonnet-4.6": {
    display_name: "Claude Sonnet 4.6 (Thinking)",
    description: "Anthropic high-performance reasoning & coding model.",
    priority: 31,
    context_window: 1000000,
    max_context_window: 1000000,
    max_tokens: 128000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "gemini-3.1-pro": {
    display_name: "Gemini 3.1 Pro (High)",
    description: "Google frontier multimodal reasoning model.",
    priority: 35,
    context_window: 1048576,
    max_context_window: 1048576,
    max_tokens: 65535,
    default_reasoning_level: "high",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
    ],
  },
  "gemini-2.5-flash": {
    display_name: "Gemini 2.5 Flash",
    description: "Google high-speed multimodal model.",
    priority: 36,
    context_window: 1048576,
    max_context_window: 1048576,
    max_tokens: 65536,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
    ],
  },
  "gemini-3.1-flash-lite": {
    display_name: "Gemini 3.1 Flash Lite",
    description: "Google ultra-fast multimodal model.",
    priority: 37,
    context_window: 1048576,
    max_context_window: 1048576,
    max_tokens: 65536,
    default_reasoning_level: "low",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
    ],
  },
  "deepseek-v4-pro": {
    display_name: "DeepSeek V4 Pro",
    description: "DeepSeek flagship coding and reasoning model.",
    priority: 40,
    context_window: 1000000,
    max_context_window: 1000000,
    max_tokens: 65536,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ],
  },
  "minimax-m3": {
    display_name: "MiniMax M3",
    description: "MiniMax advanced multimodal reasoning model.",
    priority: 42,
    context_window: 512000,
    max_context_window: 512000,
    max_tokens: 131072,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
    ],
  },
  "codex-auto-review": {
    display_name: "Codex Auto Review",
    description: "Specialized model for automatic code review.",
    priority: 45,
    context_window: 128000,
    max_context_window: 128000,
    default_reasoning_level: "medium",
    supported_reasoning_levels: [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
    ],
  },
};

const PRIMARY_PROVIDERS = new Set([
  "combo", "cx", "codex", "gh", "github", "gc", "gemini-cli", "gemini",
  "antigravity", "kiro", "kr", "deepseek", "glm", "glm-cn", "minimax", "minimax-cn",
  "xai", "grok-cli", "codebuddy-cn", "qoder", "cursor", "kimchi", "nvidia",
]);

const PROVIDER_PRIORITY_MAP = {
  combo: 0, cx: 1, codex: 1, gh: 2, github: 2, gc: 3, antigravity: 3, gemini: 3,
  kiro: 4, kr: 4, deepseek: 5, nvidia: 6, glm: 7, "glm-cn": 7, minimax: 8, "minimax-cn": 8,
  "codebuddy-cn": 9, qoder: 10, cursor: 11, kimchi: 12, "grok-cli": 13, xai: 13,
};

function formatDisplayName(slug, explicitName) {
  if (explicitName && explicitName.trim() !== "" && explicitName !== slug) {
    return explicitName.trim();
  }
  const baseName = slug.includes("/") ? slug.split("/").pop() : slug;
  return baseName
    .replace(/(?<=[a-z])-(\d+)-(\d+)(?=[-_]|$)/gi, "-$1.$2")
    .replace(/(?<!\d)\.|\.(?!\d)|[-_]+/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase())
    .replace(/\b([vr])(?=\d)/gi, (m, p1) => p1.toUpperCase())
    .replace(/\b(\d+)([bkmt])\b/gi, (m, num, unit) => `${num}${unit.toUpperCase()}`)
    .replace(/\b(Gpt|Ai|Oss|Tts|Stt|Llm|Cli|Glm|Api)\b/gi, (m) => m.toUpperCase())
    .replace(/\bDeepseek\b/gi, "DeepSeek")
    .replace(/\bMinimax\b/gi, "MiniMax")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldExcludeModel(slug, kind) {
  if (kind && kind !== "llm" && kind !== "imageToText" && kind !== "combo") {
    return true;
  }
  const lower = String(slug).toLowerCase();
  if (
    /embed|rerank|asr|tts|stt|speech|audio|parakeet|whisper|flux|dall-?e|sdxl|sd-|stable-diffusion|recraft|ideogram/i.test(
      lower
    )
  ) {
    if (!/claude|gpt-5|gpt-4|gemini|deepseek|qwen|glm|kimi|minimax/i.test(lower) || /gpt-image|imagine/i.test(lower)) {
      return true;
    }
  }
  if (/:free/i.test(lower) || /-review$/i.test(lower)) {
    return true;
  }
  if (/copilot-search-|exec-agent-|mai-code-|goldeneye-/i.test(lower)) {
    return true;
  }
  return false;
}

function getBaseKey(slug) {
  const parts = slug.split("/");
  let base = parts[parts.length - 1];
  if (base.endsWith("-review")) {
    base = base.slice(0, -7);
  }
  return base.toLowerCase();
}

function buildSingleCodexModelEntry(raw, customDisplayName = null, priorityOverride = null) {
  const isCombo = (m) => m.owned_by === "combo" || m.kind === "combo";
  const slug = String(raw.id || raw.slug || "").trim();
  const baseSlug = slug.includes("/") ? slug.split("/").pop() : slug;
  const template =
    CANONICAL_TEMPLATES[slug] ||
    CANONICAL_TEMPLATES[baseSlug] ||
    CANONICAL_TEMPLATES[getBaseKey(slug)];

  const caps = raw.capabilities || {};
  const hasVision = caps.vision === true || raw.kind === "imageToText" || isCombo(raw);
  const hasReasoning = caps.reasoning === true || template?.supported_reasoning_levels?.length > 1;
  const contextWindow =
    Number(raw.context_length) ||
    Number(caps.contextWindow) ||
    template?.context_window ||
    BASE_CODEX_TEMPLATE.context_window;
  const maxTokens =
    Number(raw.max_completion_tokens) ||
    Number(caps.maxOutput) ||
    template?.max_tokens ||
    64000;

  const displayName =
    customDisplayName ||
    raw.display_name ||
    template?.display_name ||
    formatDisplayName(slug, raw.name);
  const description = raw.description || template?.description || displayName;

  const modelEntry = {
    ...BASE_CODEX_TEMPLATE,
    slug,
    display_name: displayName,
    description,
    visibility: "list",
    context_window: contextWindow,
    max_context_window: contextWindow,
    max_tokens: maxTokens,
    input_modalities: hasVision ? ["text", "image"] : ["text"],
    supports_image_detail_original: hasVision,
    supports_parallel_tool_calls: caps.tools !== false,
    supports_search_tool: caps.search === true || Boolean(template?.supports_search_tool),
    experimental_supported_tools: [],
    additional_speed_tiers: [],
    service_tiers: [],
    default_service_tier: null,
    supports_reasoning_summary_parameter: true,
    model_messages: null,
  };

  if (priorityOverride !== null && Number.isFinite(priorityOverride)) {
    modelEntry.priority = priorityOverride;
  } else if (template) {
    modelEntry.priority = template.priority;
  } else if (isCombo(raw)) {
    modelEntry.priority = 10;
  } else {
    modelEntry.priority = 100;
  }

  if (template?.supported_reasoning_levels) {
    modelEntry.default_reasoning_level = template.default_reasoning_level || "medium";
    modelEntry.supported_reasoning_levels = template.supported_reasoning_levels;
  } else if (isCombo(raw) || hasReasoning) {
    modelEntry.supported_reasoning_levels = [
      { effort: "low", description: REASONING_DESCRIPTIONS.low },
      { effort: "medium", description: REASONING_DESCRIPTIONS.medium },
      { effort: "high", description: REASONING_DESCRIPTIONS.high },
      { effort: "xhigh", description: REASONING_DESCRIPTIONS.xhigh },
    ];
    modelEntry.default_reasoning_level = "medium";
  } else {
    modelEntry.supported_reasoning_levels = [
      { effort: "none", description: REASONING_DESCRIPTIONS.none },
    ];
    modelEntry.default_reasoning_level = "none";
  }

  return modelEntry;
}


function loadCodexCatalogConfigSync() {
  try {
    const fs = require("fs");
    const path = require("path");
    const possiblePaths = [
      path.join(process.env.DATA_DIR || "/app/data", "db", "data.sqlite"),
      "/app/data/db/data.sqlite",
      path.join(process.env.HOME || "/root", ".9router", "db", "data.sqlite"),
    ];
    let dbPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        dbPath = p;
        break;
      }
    }
    if (!dbPath) return null;

    let Database;
    try {
      Database = require("better-sqlite3");
    } catch {
      return null;
    }
    const db = new Database(dbPath, { readonly: true });
    const row = db.prepare("SELECT value FROM kv WHERE scope = ? AND key = ?").get("codexCatalog", "config");
    db.close();
    if (row && row.value) {
      return typeof row.value === "string" ? JSON.parse(row.value) : row.value;
    }
  } catch {}
  return null;
}

function buildCodexModelsResponse(models = [], userConfig = null) {
  if (!userConfig || typeof userConfig !== "object" || !userConfig.mode) {
    const loaded = loadCodexCatalogConfigSync();
    if (loaded && loaded.mode) {
      userConfig = loaded;
    }
  }
  const isCombo = (m) => m.owned_by === "combo" || m.kind === "combo";

  // Check if Custom Whitelist Mode is active
  if (userConfig?.mode === "custom" && Array.isArray(userConfig.selectedModelIds)) {
    const rawMap = new Map();
    for (const raw of models) {
      if (raw && raw.id) {
        rawMap.set(String(raw.id).trim(), raw);
      }
    }

    const customResult = [];
    const customDisplayNames = userConfig.customDisplayNames || {};

    userConfig.selectedModelIds.forEach((modelId, index) => {
      const slug = String(modelId).trim();
      if (!slug) return;
      const raw = rawMap.get(slug) || { id: slug, owned_by: slug.includes("/") ? slug.split("/")[0] : "custom" };
      const customName = customDisplayNames[slug] || null;
      const entry = buildSingleCodexModelEntry(raw, customName, index + 1);
      customResult.push(entry);
    });

    return { models: customResult };
  }

  // Default: Smart Deduplication and Clean Catalog Filtering
  const modelCandidates = new Map();

  for (const raw of models) {
    if (!raw || !raw.id) continue;
    const slug = String(raw.id).trim();
    if (!slug) continue;
    if (shouldExcludeModel(slug, raw.kind)) continue;

    const provider = slug.includes("/")
      ? slug.split("/")[0].toLowerCase()
      : isCombo(raw)
      ? "combo"
      : (raw.owned_by || "other").toLowerCase();

    if (!PRIMARY_PROVIDERS.has(provider) && !isCombo(raw)) {
      continue;
    }

    const baseKey = isCombo(raw) ? slug.toLowerCase() : getBaseKey(slug);
    const providerRank = PROVIDER_PRIORITY_MAP[provider] ?? 20;

    const existing = modelCandidates.get(baseKey);
    if (!existing || providerRank < existing.rank) {
      modelCandidates.set(baseKey, { rank: providerRank, raw });
    }
  }

  const result = [];
  const nonTemplateItems = [];
  const customDisplayNames = userConfig?.customDisplayNames || {};

  for (const { raw } of modelCandidates.values()) {
    const slug = String(raw.id).trim();
    const customName = customDisplayNames[slug] || null;
    const modelEntry = buildSingleCodexModelEntry(raw, customName);

    const baseSlug = slug.includes("/") ? slug.split("/").pop() : slug;
    const hasTemplate =
      Boolean(CANONICAL_TEMPLATES[slug] || CANONICAL_TEMPLATES[baseSlug] || CANONICAL_TEMPLATES[getBaseKey(slug)]);

    if (!hasTemplate && !isCombo(raw)) {
      nonTemplateItems.push(modelEntry);
    }
    result.push(modelEntry);
  }

  nonTemplateItems.sort((a, b) => {
    const nameA = (a.display_name || a.slug).toLowerCase();
    const nameB = (b.display_name || b.slug).toLowerCase();
    if (nameA === nameB) return a.slug.localeCompare(b.slug);
    return nameA.localeCompare(nameB);
  });

  nonTemplateItems.forEach((entry, idx) => {
    entry.priority = 50 + (idx + 1) * 2;
  });

  result.sort((a, b) => (a.priority || 100) - (b.priority || 100));

  return { models: result };
}

function getAvailableCodexCandidates(models = []) {
  const isCombo = (m) => m.owned_by === "combo" || m.kind === "combo";
  const defaultCatalog = buildCodexModelsResponse(models, { mode: "auto" }).models;
  const defaultRecommendedSlugs = new Set(defaultCatalog.map((m) => m.slug));

  const candidates = [];
  const seenSlugs = new Set();

  for (const raw of models) {
    if (!raw || !raw.id) continue;
    const slug = String(raw.id).trim();
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    if (shouldExcludeModel(slug, raw.kind)) continue;

    const provider = slug.includes("/")
      ? slug.split("/")[0]
      : isCombo(raw)
      ? "combo"
      : (raw.owned_by || "other");

    const caps = raw.capabilities || {};
    const hasVision = caps.vision === true || raw.kind === "imageToText" || isCombo(raw);
    const hasReasoning = caps.reasoning === true;
    const hasTools = caps.tools !== false;

    candidates.push({
      id: slug,
      displayName: raw.display_name || formatDisplayName(slug, raw.name),
      provider,
      kind: raw.kind || (isCombo(raw) ? "combo" : "llm"),
      hasVision,
      hasReasoning,
      hasTools,
      isRecommended: defaultRecommendedSlugs.has(slug),
    });
  }

  return {
    candidates,
    recommendedIds: Array.from(defaultRecommendedSlugs),
  };
}

const codexModule = {
  buildCodexModelsResponse,
  formatDisplayName,
  getAvailableCodexCandidates,
  loadCodexCatalogConfigSync,
  CANONICAL_TEMPLATES,
};

module.exports = codexModule;
module.exports.default = codexModule;
module.exports.buildCodexModelsResponse = buildCodexModelsResponse;
module.exports.formatDisplayName = formatDisplayName;
module.exports.getAvailableCodexCandidates = getAvailableCodexCandidates;
module.exports.loadCodexCatalogConfigSync = loadCodexCatalogConfigSync;
module.exports.CANONICAL_TEMPLATES = CANONICAL_TEMPLATES;
