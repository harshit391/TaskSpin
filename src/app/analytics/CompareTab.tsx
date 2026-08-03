"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

type RangePreset = "7d" | "30d" | "this_month" | "last_month" | "90d" | "custom";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "90d", label: "90 Days" },
  { value: "custom", label: "Custom" },
];

interface RangeSelection {
  preset: RangePreset;
  start?: string;
  end?: string;
}

interface SavedComparison {
  id: string;
  label: string;
  rangeA: RangeSelection;
  rangeB: RangeSelection;
  savedAt: number;
}

interface DailyStats {
  id: string;
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  tasksActive: number;
  avgCompletionMs: number | null;
}

const STORAGE_KEY = "taskspin_comparisons";
const MAX_SAVED = 5;

function loadSaved(): SavedComparison[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTo(comparisons: SavedComparison[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisons.slice(0, MAX_SAVED)));
}

function getDateBounds(sel: RangeSelection): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (sel.preset) {
    case "7d": {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 7);
      return { start: s, end: todayStart };
    }
    case "30d": {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 30);
      return { start: s, end: todayStart };
    }
    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: s, end: todayStart };
    }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: s, end: e };
    }
    case "90d": {
      const s = new Date(todayStart);
      s.setDate(s.getDate() - 90);
      return { start: s, end: todayStart };
    }
    case "custom": {
      const s = sel.start ? new Date(sel.start) : new Date(todayStart);
      const e = sel.end ? new Date(sel.end) : todayStart;
      return { start: s, end: e };
    }
  }
}

function getDaysNeeded(sel: RangeSelection): number {
  const { start } = getDateBounds(sel);
  const now = new Date();
  const diff = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 90);
}

function filterStats(stats: DailyStats[], sel: RangeSelection): DailyStats[] {
  const { start, end } = getDateBounds(sel);
  return stats.filter((s) => {
    const d = new Date(s.date);
    return d >= start && d < end;
  });
}

function getLabel(sel: RangeSelection): string {
  if (sel.preset === "custom" && sel.start && sel.end) {
    return `${new Date(sel.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(sel.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return PRESETS.find((p) => p.value === sel.preset)?.label ?? sel.preset;
}

async function fetchAnalytics(days: number): Promise<DailyStats[]> {
  const res = await fetch(`/api/analytics?days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

function RangeSelector({ label, value, onChange }: { label: string; value: RangeSelection; onChange: (v: RangeSelection) => void }) {
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <p className="text-[11px] text-text-muted uppercase tracking-wider">{label}</p>
      <select
        value={value.preset}
        onChange={(e) => onChange({ ...value, preset: e.target.value as RangePreset })}
        className="w-full px-3 py-2 text-sm bg-bg-primary border border-border rounded-[4px] text-text-primary min-h-[44px] focus:outline-none focus:border-accent"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <AnimatePresence>
        {value.preset === "custom" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 overflow-hidden"
          >
            <input
              type="date"
              value={value.start ?? ""}
              onChange={(e) => onChange({ ...value, start: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs bg-bg-primary border border-border rounded-[4px] text-text-primary min-h-[40px] focus:outline-none focus:border-accent"
            />
            <input
              type="date"
              value={value.end ?? ""}
              onChange={(e) => onChange({ ...value, end: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs bg-bg-primary border border-border rounded-[4px] text-text-primary min-h-[40px] focus:outline-none focus:border-accent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, valueA, valueB }: { label: string; valueA: number; valueB: number }) {
  const diff = valueA === 0 && valueB === 0 ? 0 : valueB === 0 ? 100 : ((valueA - valueB) / valueB) * 100;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return (
    <div className="bg-bg-card border border-border rounded-[4px] p-3 sm:p-4">
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-text-primary">{valueA}</p>
          <p className="text-[10px] text-text-muted">Range A</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-text-primary">{valueB}</p>
          <p className="text-[10px] text-text-muted">Range B</p>
        </div>
      </div>
      {!isNeutral && (
        <p className={`text-[11px] mt-2 font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {isPositive ? "+" : ""}{diff.toFixed(1)}% vs Range B
        </p>
      )}
    </div>
  );
}

export function CompareTab() {
  const [rangeA, setRangeA] = useState<RangeSelection>({ preset: "this_month" });
  const [rangeB, setRangeB] = useState<RangeSelection>({ preset: "last_month" });
  const [saved, setSaved] = useState<SavedComparison[]>([]);

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const daysA = getDaysNeeded(rangeA);
  const daysB = getDaysNeeded(rangeB);
  const maxDays = Math.max(daysA, daysB);

  const isRangeHistorical = useCallback((sel: RangeSelection) => {
    const { end } = getDateBounds(sel);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return end < today;
  }, []);

  const staleTime = isRangeHistorical(rangeA) && isRangeHistorical(rangeB) ? Infinity : 1000 * 60 * 5;

  const { data: rawStats = [], isLoading } = useQuery({
    queryKey: ["analytics", maxDays, "compare"],
    queryFn: () => fetchAnalytics(maxDays),
    staleTime,
  });

  const statsA = useMemo(() => filterStats(rawStats, rangeA), [rawStats, rangeA]);
  const statsB = useMemo(() => filterStats(rawStats, rangeB), [rawStats, rangeB]);

  const metricsA = useMemo(() => ({
    totalCreated: statsA.reduce((s, d) => s + d.tasksCreated, 0),
    totalCompleted: statsA.reduce((s, d) => s + d.tasksCompleted, 0),
    dailyAvg: statsA.length > 0 ? statsA.reduce((s, d) => s + d.tasksCompleted, 0) / statsA.length : 0,
  }), [statsA]);

  const metricsB = useMemo(() => ({
    totalCreated: statsB.reduce((s, d) => s + d.tasksCreated, 0),
    totalCompleted: statsB.reduce((s, d) => s + d.tasksCompleted, 0),
    dailyAvg: statsB.length > 0 ? statsB.reduce((s, d) => s + d.tasksCompleted, 0) / statsB.length : 0,
  }), [statsB]);

  const canSave = rangeA.preset !== "custom" || (rangeA.start && rangeA.end);

  function handleSave() {
    const comparison: SavedComparison = {
      id: crypto.randomUUID(),
      label: `${getLabel(rangeA)} vs ${getLabel(rangeB)}`,
      rangeA,
      rangeB,
      savedAt: Date.now(),
    };
    const updated = [comparison, ...saved].slice(0, MAX_SAVED);
    setSaved(updated);
    saveTo(updated);
  }

  function handleLoad(c: SavedComparison) {
    setRangeA(c.rangeA);
    setRangeB(c.rangeB);
  }

  function handleDelete(id: string) {
    const updated = saved.filter((c) => c.id !== id);
    setSaved(updated);
    saveTo(updated);
  }

  return (
    <div className="space-y-5">
      {/* Range Selectors */}
      <div className="flex flex-col sm:flex-row gap-3">
        <RangeSelector label="Range A" value={rangeA} onChange={setRangeA} />
        <div className="hidden sm:flex items-center pt-6">
          <span className="text-text-muted text-xs">vs</span>
        </div>
        <RangeSelector label="Range B" value={rangeB} onChange={setRangeB} />
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 text-xs font-medium border border-accent text-accent rounded-[4px] hover:bg-accent/10 transition-all min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Comparison
        </button>
      </div>

      {/* Saved Comparisons */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Saved</p>
          <div className="flex flex-wrap gap-2">
            {saved.map((c) => (
              <div key={c.id} className="flex items-center gap-1 bg-bg-secondary border border-border rounded-[4px] overflow-hidden">
                <button
                  onClick={() => handleLoad(c)}
                  className="px-3 py-1.5 text-[11px] text-text-secondary hover:text-text-primary transition-colors min-h-[32px]"
                >
                  {c.label}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-2 py-1.5 text-text-muted hover:text-red-400 transition-colors min-h-[32px] border-l border-border"
                  aria-label="Delete comparison"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
          </svg>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Comparison Header */}
          <div className="flex items-center justify-between text-[11px] text-text-muted">
            <span className="font-medium text-[#4A9EFF]">A: {getLabel(rangeA)} ({statsA.length}d)</span>
            <span className="font-medium text-accent">B: {getLabel(rangeB)} ({statsB.length}d)</span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard label="Created" valueA={metricsA.totalCreated} valueB={metricsB.totalCreated} />
            <MetricCard label="Completed" valueA={metricsA.totalCompleted} valueB={metricsB.totalCompleted} />
            <MetricCard label="Daily Avg (completed)" valueA={Math.round(metricsA.dailyAvg * 10) / 10} valueB={Math.round(metricsB.dailyAvg * 10) / 10} />
          </div>

          {/* Completion Rate */}
          <div className="bg-bg-card border border-border rounded-[4px] p-4">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-3">Completion Rate</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-[#4A9EFF]">
                  {metricsA.totalCreated > 0 ? Math.round((metricsA.totalCompleted / metricsA.totalCreated) * 100) : 0}%
                </p>
                <p className="text-[10px] text-text-muted">Range A</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-accent">
                  {metricsB.totalCreated > 0 ? Math.round((metricsB.totalCompleted / metricsB.totalCreated) * 100) : 0}%
                </p>
                <p className="text-[10px] text-text-muted">Range B</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
