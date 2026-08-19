"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/shared/components";
import { translate } from "@/i18n/runtime";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";

export default function CodexCatalogClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("auto"); // "auto" | "custom"
  const [selectedIds, setSelectedIds] = useState([]);
  const [customNames, setCustomNames] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProviderTab, setSelectedProviderTab] = useState("all");
  const [message, setMessage] = useState(null);

  // Model Testing State
  const [testingModelIds, setTestingModelIds] = useState(() => new Set());
  const [modelTestResults, setModelTestResults] = useState({});
  const [batchTesting, setBatchTesting] = useState(false);

  const { copied, copy } = useCopyToClipboard();

  const fetchCatalogData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cli-tools/codex-settings/catalog");
      if (!res.ok) throw new Error("Failed to fetch catalog configuration");
      const data = await res.json();
      setMode(data.mode || "auto");
      setSelectedIds(Array.isArray(data.selectedModelIds) ? data.selectedModelIds : []);
      setCustomNames(data.customDisplayNames || {});
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      setRecommendedIds(Array.isArray(data.recommendedIds) ? data.recommendedIds : []);
    } catch (err) {
      console.error("Error loading codex catalog:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  const providerTabs = useMemo(() => {
    const set = new Set();
    candidates.forEach((c) => {
      if (c.provider) set.add(c.provider);
    });
    return ["all", ...Array.from(set)];
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidates.filter((c) => {
      if (selectedProviderTab !== "all" && c.provider !== selectedProviderTab) return false;
      if (!q) return true;
      const customName = customNames[c.id] || "";
      return (
        c.id.toLowerCase().includes(q) ||
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        customName.toLowerCase().includes(q)
      );
    });
  }, [candidates, searchQuery, selectedProviderTab, customNames]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleImportRecommended = () => {
    setSelectedIds(Array.from(new Set([...recommendedIds])));
    setMode("custom");
    setMessage({ type: "success", text: translate("Imported") + " " + recommendedIds.length + " " + translate("recommended models as whitelist.") });
  };

  const handleSelectAllFiltered = () => {
    const currentFilteredIds = filteredCandidates.map((c) => c.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
  };

  const handleClearAll = () => setSelectedIds([]);

  // Single Model Test Handler
  const handleTestModel = async (e, model) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    const modelId = model.id;
    if (testingModelIds.has(modelId)) return;
    setTestingModelIds((prev) => new Set(prev).add(modelId));

    try {
      const res = await fetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId, kind: model.kind || "llm" }),
      });
      const data = await res.json();
      setModelTestResults((prev) => ({
        ...prev,
        [modelId]: {
          status: data.ok ? "ok" : "error",
          latencyMs: data.latencyMs,
          error: data.ok ? null : (data.error || "Model not reachable"),
        },
      }));
    } catch (err) {
      setModelTestResults((prev) => ({
        ...prev,
        [modelId]: {
          status: "error",
          error: err.message || "Network error",
        },
      }));
    } finally {
      setTestingModelIds((prev) => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });
    }
  };

  // Batch Test Selected Models Handler
  const handleTestSelected = async () => {
    const targets = candidates.filter((c) => selectedIds.includes(c.id));
    if (targets.length === 0 || batchTesting) return;
    setBatchTesting(true);
    for (const model of targets) {
      await handleTestModel(null, model);
    }
    setBatchTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cli-tools/codex-settings/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, selectedModelIds: selectedIds, customDisplayNames: customNames }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: translate("Codex visible catalog saved successfully! Effective immediately.") });
      } else {
        setMessage({ type: "error", text: data.error || translate("Failed to save configuration") });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToAuto = async () => {
    if (!confirm(translate("Are you sure you want to reset to default automatic recommendation?"))) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cli-tools/codex-settings/catalog", { method: "DELETE" });
      if (res.ok) {
        setMode("auto");
        setSelectedIds([]);
        setMessage({ type: "success", text: translate("Reset to auto recommendations") });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-2 sm:px-4 py-2">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">tune</span>
            <h1 className="text-xl font-semibold text-text-main sm:text-2xl">{translate("Codex Catalog")}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Desktop & CLI</span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            {translate("Control which models are visible in OpenAI Codex. Supports custom whitelist, custom aliases, and auto smart curation.")}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => setMode("auto")}
            className={"px-3 py-1.5 text-xs rounded-lg font-medium transition-colors " + (mode === "auto" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main")}
          >
            {translate("Auto Recommendation")}
          </button>
          <button
            onClick={() => {
              setMode("custom");
              if (selectedIds.length === 0 && recommendedIds.length > 0) {
                setSelectedIds([...recommendedIds]);
              }
            }}
            className={"px-3 py-1.5 text-xs rounded-lg font-medium transition-colors " + (mode === "custom" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main")}
          >
            {translate("Custom Whitelist")}
          </button>
        </div>
      </div>

      {/* Mode Status Callout */}
      <div className={"p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 " + (mode === "custom" ? "bg-primary/5 border-primary/20" : "bg-surface border-border")}>
        <div className="flex items-center gap-3">
          <div className={"size-9 rounded-lg flex items-center justify-center shrink-0 " + (mode === "custom" ? "bg-primary/10 text-primary" : "bg-text-muted/10 text-text-muted")}>
            <span className="material-symbols-outlined text-[20px]">{mode === "custom" ? "checklist" : "auto_mode"}</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-text-main">
              {mode === "custom" ? translate("Custom Whitelist Mode Active") : translate("Auto Smart Curation Active (106 Models)")}
            </h3>
            <p className="text-xs text-text-muted">
              {mode === "custom"
                ? translate("Only models checked below will be delivered to Codex Desktop App & CLI in your selected order.")
                : translate("9router automatically deduplicates and provides top-tier curated models and combos.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button variant="outline" size="sm" onClick={handleImportRecommended} className="text-xs">
            <span className="material-symbols-outlined text-[14px] mr-1">auto_fix_high</span>
            {translate("Import Recommended")} ({recommendedIds.length})
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetToAuto} disabled={saving} className="text-xs text-text-muted hover:text-red-500">
            <span className="material-symbols-outlined text-[14px] mr-1">restart_alt</span>
            {translate("Reset")}
          </Button>
        </div>
      </div>

      {/* Search & Tabs Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
            <input
              type="text"
              placeholder={translate("Search models by ID or name...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs">
            <span className="text-text-muted">
              {translate("Selected:")} <strong className="text-primary font-semibold text-sm">{selectedIds.length}</strong> / {candidates.length} {translate("models")}
            </span>
            <div className="flex items-center gap-1.5">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleTestSelected}
                  disabled={batchTesting}
                  className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-main hover:border-primary transition-colors font-medium flex items-center gap-1"
                  title={translate("Test all selected models")}
                >
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={batchTesting ? { animation: "spin 1s linear infinite" } : undefined}
                  >
                    {batchTesting ? "progress_activity" : "science"}
                  </span>
                  {batchTesting ? translate("Testing Selected...") : translate("Test Selected")}
                </button>
              )}
              <button onClick={handleSelectAllFiltered} className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-main hover:border-primary transition-colors font-medium">
                {translate("Select Filtered")}
              </button>
              <button onClick={handleClearAll} className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-muted hover:text-red-500 transition-colors">
                {translate("Clear")}
              </button>
            </div>
          </div>
        </div>

        {/* Provider Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {providerTabs.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProviderTab(p)}
              className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap " + (selectedProviderTab === p ? "bg-primary text-white border-primary" : "bg-surface border-border text-text-muted hover:border-primary/50 hover:text-text-main")}
            >
              {p === "all" ? translate("All Providers") : p}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted text-sm gap-3">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
          <span>{translate("Loading Codex model candidates...")}</span>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-20 bg-surface/40 border border-border border-dashed rounded-xl text-text-muted">
          <span className="material-symbols-outlined text-4xl mb-2 block opacity-60">search_off</span>
          <p className="text-sm font-medium">{translate("No matching models found")}</p>
          <p className="text-xs text-text-muted mt-1">{translate("Try another search keyword or switch Provider tab")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCandidates.map((model) => {
            const isChecked = selectedIds.includes(model.id);
            const isTesting = testingModelIds.has(model.id);
            const testResult = modelTestResults[model.id];
            const testStatus = testResult?.status;

            const cardBorderColor = testStatus === "ok"
              ? "border-green-500/50 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]"
              : testStatus === "error"
              ? "border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]"
              : isChecked
              ? "bg-primary/8 border-primary/40 shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.2)]"
              : "bg-surface border-border hover:border-border-hover hover:bg-surface-2";

            return (
              <div
                key={model.id}
                onClick={() => handleToggleSelect(model.id)}
                className={`group/card flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${cardBorderColor}`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="size-4 mt-0.5 rounded border-border text-primary focus:ring-primary/50 cursor-pointer shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-text-main truncate">
                          {model.displayName || model.id}
                        </span>
                        {model.isRecommended && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-primary/10 text-primary rounded font-semibold flex items-center gap-0.5 shrink-0">
                            <span className="material-symbols-outlined text-[10px]">star</span>
                            {translate("Recommended")}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-muted font-mono truncate mt-0.5" title={model.id}>
                        {model.id}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Test & Copy */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Test Button */}
                    <div className="relative group/btn">
                      <button
                        type="button"
                        onClick={(e) => handleTestModel(e, model)}
                        disabled={isTesting}
                        className={`p-1 rounded text-text-muted hover:bg-sidebar hover:text-primary transition-colors ${isTesting ? "opacity-100" : "opacity-100 sm:opacity-70 sm:group-hover/card:opacity-100"}`}
                        title={isTesting ? translate("Testing...") : translate("Test")}
                      >
                        <span
                          className="material-symbols-outlined text-[17px] block"
                          style={
                            isTesting
                              ? { animation: "spin 1s linear infinite" }
                              : testStatus === "ok"
                              ? { color: "#22c55e" }
                              : testStatus === "error"
                              ? { color: "#ef4444" }
                              : undefined
                          }
                        >
                          {isTesting ? "progress_activity" : testStatus === "ok" ? "check_circle" : testStatus === "error" ? "cancel" : "science"}
                        </span>
                      </button>
                      <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] bg-sidebar border border-border px-1.5 py-0.5 rounded text-text-muted whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-10 shadow-sm">
                        {isTesting
                          ? translate("Testing...")
                          : testResult?.latencyMs
                          ? `${testResult.latencyMs}ms`
                          : testResult?.error
                          ? testResult.error
                          : translate("Test")}
                      </span>
                    </div>

                    {/* Copy Button */}
                    <div className="relative group/btn">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copy(model.id, `model-${model.id}`);
                        }}
                        className="p-1 rounded text-text-muted hover:bg-sidebar hover:text-primary transition-colors opacity-100 sm:opacity-70 sm:group-hover/card:opacity-100"
                        title={copied === `model-${model.id}` ? translate("Copied!") : translate("Copy")}
                      >
                        <span className="material-symbols-outlined text-[17px] block">
                          {copied === `model-${model.id}` ? "check" : "content_copy"}
                        </span>
                      </button>
                      <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] bg-sidebar border border-border px-1.5 py-0.5 rounded text-text-muted whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity z-10 shadow-sm">
                        {copied === `model-${model.id}` ? translate("Copied!") : translate("Copy")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Provider & Test Latency / Status & Capabilities */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50 text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted font-medium shrink-0">
                      {model.provider}
                    </span>
                    {testStatus === "ok" && testResult?.latencyMs && (
                      <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-mono font-medium shrink-0">
                        {testResult.latencyMs}ms
                      </span>
                    )}
                    {testStatus === "error" && (
                      <span
                        className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium truncate max-w-[110px]"
                        title={testResult.error || "Failed"}
                      >
                        {testResult.error || "Failed"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {model.hasVision && (
                      <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded font-medium" title="Supports Vision (Image Input)">
                        Vision
                      </span>
                    )}
                    {model.hasReasoning && (
                      <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded font-medium" title="Supports Reasoning / Thinking">
                        Thinking
                      </span>
                    )}
                    {model.hasTools && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-medium" title="Supports Tools & Function Calling">
                        Tools
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Save Bar */}
      <div className="sticky bottom-4 z-20 mt-4 p-4 rounded-xl bg-surface/95 backdrop-blur-md border border-border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {message ? (
            <div className={"flex items-center gap-2 text-xs font-medium " + (message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              <span className="material-symbols-outlined text-[16px]">{message.type === "success" ? "check_circle" : "error"}</span>
              <span>{message.text}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="material-symbols-outlined text-primary text-[16px]">info</span>
              <span>{translate("Changes take effect immediately on Codex client model reload.")}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={fetchCatalogData} disabled={saving}>
            {translate("Refresh")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} className="px-5">
            <span className="material-symbols-outlined text-[16px] mr-1.5">save</span>
            {translate("Save & Apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
