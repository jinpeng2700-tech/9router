"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, Card } from "@/shared/components";

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

  const fetchCatalogData = async () => {
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
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

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
    setMessage({ type: "success", text: "Imported " + recommendedIds.length + " recommended models as whitelist." });
  };

  const handleSelectAllFiltered = () => {
    const currentFilteredIds = filteredCandidates.map((c) => c.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
  };

  const handleClearAll = () => setSelectedIds([]);

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
        setMessage({ type: "success", text: "Codex visible catalog saved successfully! Effective immediately." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save configuration" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToAuto = async () => {
    if (!confirm("Are you sure you want to reset to default automatic recommendation?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cli-tools/codex-settings/catalog", { method: "DELETE" });
      if (res.ok) {
        setMode("auto");
        setSelectedIds([]);
        setMessage({ type: "success", text: "Reset to auto recommendations" });
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
            <h1 className="text-xl font-semibold text-text-main sm:text-2xl">Codex Catalog</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Desktop & CLI</span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Control which models are visible in OpenAI Codex. Supports custom whitelist, custom aliases, and auto smart curation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border p-1 rounded-xl shrink-0">
          <button
            onClick={() => setMode("auto")}
            className={"px-3 py-1.5 text-xs rounded-lg font-medium transition-colors " + (mode === "auto" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main")}
          >
            Auto Recommendation
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
            Custom Whitelist
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
              {mode === "custom" ? "Custom Whitelist Mode Active" : "Auto Smart Curation Active (106 Models)"}
            </h3>
            <p className="text-xs text-text-muted">
              {mode === "custom"
                ? "Only models checked below will be delivered to Codex Desktop App & CLI in your selected order."
                : "9router automatically deduplicates and provides top-tier curated models and combos."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button variant="outline" size="sm" onClick={handleImportRecommended} className="text-xs">
            <span className="material-symbols-outlined text-[14px] mr-1">auto_fix_high</span>
            Import Recommended ({recommendedIds.length})
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetToAuto} disabled={saving} className="text-xs text-text-muted hover:text-red-500">
            <span className="material-symbols-outlined text-[14px] mr-1">restart_alt</span>
            Reset
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
              placeholder="Search models by ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs">
            <span className="text-text-muted">
              Selected: <strong className="text-primary font-semibold text-sm">{selectedIds.length}</strong> / {candidates.length} models
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={handleSelectAllFiltered} className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-main hover:border-primary transition-colors font-medium">
                Select Filtered
              </button>
              <button onClick={handleClearAll} className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-text-muted hover:text-red-500 transition-colors">
                Clear
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
              {p === "all" ? "All Providers" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted text-sm gap-3">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
          <span>Loading Codex model candidates...</span>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="text-center py-20 bg-surface/40 border border-border border-dashed rounded-xl text-text-muted">
          <span className="material-symbols-outlined text-4xl mb-2 block opacity-60">search_off</span>
          <p className="text-sm font-medium">No matching models found</p>
          <p className="text-xs text-text-muted mt-1">Try another search keyword or switch Provider tab</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCandidates.map((model) => {
            const isChecked = selectedIds.includes(model.id);
            return (
              <div
                key={model.id}
                onClick={() => handleToggleSelect(model.id)}
                className={"flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none " + (isChecked ? "bg-primary/8 border-primary/40 shadow-[0_0_0_1px_rgba(var(--primary-rgb),0.2)]" : "bg-surface border-border hover:border-border-hover hover:bg-surface-2")}
              >
                <div className="flex items-start gap-3">
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
                        <span className="px-1.5 py-0.2 text-[9px] bg-primary/10 text-primary rounded font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">star</span>
                          Recommended
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted font-mono truncate mt-0.5" title={model.id}>
                      {model.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted font-medium">
                    {model.provider}
                  </span>
                  <div className="flex items-center gap-1.5">
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
              <span>Changes take effect immediately on Codex client model reload.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" onClick={fetchCatalogData} disabled={saving}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} className="px-5">
            <span className="material-symbols-outlined text-[16px] mr-1.5">save</span>
            Save & Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
