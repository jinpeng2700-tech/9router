"use client";

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Modal, Button } from "@/shared/components";

export default function CodexCatalogModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("auto");
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
    if (isOpen) fetchCatalogData();
  }, [isOpen]);

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
    setMessage({ type: "success", text: "Imported " + recommendedIds.length + " recommended models" });
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
        setMessage({ type: "success", text: "Codex model list updated successfully!" });
        setTimeout(() => onClose(), 600);
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
        setTimeout(() => onClose(), 500);
      } else {
        setMessage({ type: "error", text: "Failed to reset" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Codex Visible Models" size="lg" className="p-5! max-w-3xl">
      <div className="flex flex-col gap-4">
        <div className="p-3 bg-surface border border-border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-text-main flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
              Model List Filtering Mode
            </span>
            <span className="text-xs text-text-muted">
              {mode === "custom"
                ? "Custom Whitelist Mode: Only selected models will appear in Codex App & CLI."
                : "Auto Recommendation Mode: 9router automatically filters and provides clean curated models."}
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setMode("auto")}
              className={"px-3 py-1 text-xs rounded font-medium transition-colors border " + (mode === "auto" ? "bg-primary text-white border-primary" : "bg-surface border-border text-text-muted hover:border-primary")}
            >
              Auto (Default)
            </button>
            <button
              onClick={() => {
                setMode("custom");
                if (selectedIds.length === 0 && recommendedIds.length > 0) {
                  setSelectedIds([...recommendedIds]);
                }
              }}
              className={"px-3 py-1 text-xs rounded font-medium transition-colors border " + (mode === "custom" ? "bg-primary text-white border-primary" : "bg-surface border-border text-text-muted hover:border-primary")}
            >
              Custom Whitelist
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">
              Selected: <strong className="text-primary font-semibold">{selectedIds.length}</strong> / {candidates.length} available
            </span>
            {mode === "auto" && (
              <span className="text-[11px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                (Switch to Custom mode to apply selection)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleImportRecommended}
              className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
              Import Recommended ({recommendedIds.length})
            </button>
            <button
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1 rounded bg-surface border border-border text-text-main hover:border-primary transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded bg-surface border border-border text-text-muted hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[16px]">search</span>
            <input
              type="text"
              placeholder="Search by model ID or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto py-1">
            {providerTabs.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProviderTab(p)}
                className={"px-2 py-0.5 rounded text-[11px] font-medium border transition-colors " + (selectedProviderTab === p ? "bg-primary text-white border-primary" : "bg-surface border-border text-text-muted hover:border-primary/50 hover:text-text-main")}
              >
                {p === "all" ? "All Providers" : p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-text-muted text-xs gap-2">
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            Loading models...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-xs">
            <span className="material-symbols-outlined text-3xl mb-1 block">search_off</span>
            No matching models found
          </div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto border border-border rounded-lg divide-y divide-border bg-surface/50">
            {filteredCandidates.map((model) => {
              const isChecked = selectedIds.includes(model.id);
              return (
                <div
                  key={model.id}
                  onClick={() => handleToggleSelect(model.id)}
                  className={"flex items-center justify-between p-2.5 transition-colors cursor-pointer hover:bg-primary/5 " + (isChecked ? "bg-primary/8" : "")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="size-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-xs text-text-main truncate">
                          {model.displayName || model.id}
                        </span>
                        {model.isRecommended && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-primary/10 text-primary rounded font-semibold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">star</span>
                            Recommended
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 text-[9px] bg-surface border border-border text-text-muted rounded">
                          {model.provider}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-muted font-mono truncate">{model.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {model.hasVision && (
                      <span className="px-1 py-0.5 text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">Vision</span>
                    )}
                    {model.hasReasoning && (
                      <span className="px-1 py-0.5 text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">Thinking</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {message && (
          <div className={"flex items-center gap-2 px-3 py-2 rounded text-xs " + (message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>
            <span className="material-symbols-outlined text-[16px]">{message.type === "success" ? "check_circle" : "error"}</span>
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleResetToAuto} disabled={saving} className="text-text-muted hover:text-red-500">
            <span className="material-symbols-outlined text-[14px] mr-1">restart_alt</span>
            Reset to Auto
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              <span className="material-symbols-outlined text-[14px] mr-1">save</span>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

CodexCatalogModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
