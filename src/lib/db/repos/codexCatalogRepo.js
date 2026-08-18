import { getAdapter } from "../driver.js";
import { parseJson, stringifyJson } from "../helpers/jsonCol.js";

const SCOPE = "codexCatalog";
const CONFIG_KEY = "config";

export const DEFAULT_CODEX_CATALOG_CONFIG = {
  mode: "auto", // "auto" | "custom"
  selectedModelIds: [],
  customDisplayNames: {},
};

export async function getCodexCatalogConfig() {
  try {
    const db = await getAdapter();
    const row = db.get(`SELECT value FROM kv WHERE scope = ? AND key = ?`, [SCOPE, CONFIG_KEY]);
    if (!row || !row.value) {
      return { ...DEFAULT_CODEX_CATALOG_CONFIG };
    }
    const parsed = parseJson(row.value, {});
    return {
      mode: parsed.mode === "custom" ? "custom" : "auto",
      selectedModelIds: Array.isArray(parsed.selectedModelIds) ? parsed.selectedModelIds : [],
      customDisplayNames: parsed.customDisplayNames && typeof parsed.customDisplayNames === "object" ? parsed.customDisplayNames : {},
    };
  } catch (err) {
    console.log("Error reading codex catalog config:", err);
    return { ...DEFAULT_CODEX_CATALOG_CONFIG };
  }
}

export async function setCodexCatalogConfig(config) {
  const db = await getAdapter();
  const next = {
    mode: config?.mode === "custom" ? "custom" : "auto",
    selectedModelIds: Array.isArray(config?.selectedModelIds) ? config.selectedModelIds : [],
    customDisplayNames: config?.customDisplayNames && typeof config.customDisplayNames === "object" ? config.customDisplayNames : {},
  };

  db.transaction(() => {
    db.run(
      `INSERT INTO kv(scope, key, value) VALUES(?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`,
      [SCOPE, CONFIG_KEY, stringifyJson(next)]
    );
  });

  return next;
}

export async function resetCodexCatalogConfig() {
  const db = await getAdapter();
  db.transaction(() => {
    db.run(`DELETE FROM kv WHERE scope = ? AND key = ?`, [SCOPE, CONFIG_KEY]);
  });
  return { ...DEFAULT_CODEX_CATALOG_CONFIG };
}
