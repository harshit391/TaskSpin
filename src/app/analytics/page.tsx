"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import dynamic from "next/dynamic";

const OverviewCharts = dynamic(() => import("./OverviewCharts").then((m) => ({ default: m.OverviewCharts })), {
  loading: () => <ChartLoadingSpinner />,
  ssr: false,
});

const CompareTab = dynamic(() => import("./CompareTab").then((m) => ({ default: m.CompareTab })), {
  loading: () => <ChartLoadingSpinner />,
  ssr: false,
});

function ChartLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
      </svg>
    </div>
  );
}

type TimeRange = "yesterday" | "7d" | "30d" | "this_month" | "last_month" | "90d";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "90d", label: "90 Days" },
];

function getDateRange(range: TimeRange): { days: number; filterFn: (dateStr: string) => boolean } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "yesterday": {
      const ydayStart = new Date(todayStart); ydayStart.setDate(ydayStart.getDate() - 1);
      return { days: 2, filterFn: (d) => { const dt = new Date(d); return dt >= ydayStart && dt < todayStart; } };
    }
    case "7d":
      return { days: 7, filterFn: () => true };
    case "30d":
      return { days: 30, filterFn: () => true };
    case "this_month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { days: now.getDate(), filterFn: (d) => new Date(d) >= monthStart };
    }
    case "last_month": {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      return { days: 60, filterFn: (d) => { const dt = new Date(d); return dt >= lastMonthStart && dt < lastMonthEnd; } };
    }
    case "90d":
      return { days: 90, filterFn: () => true };
  }
}

interface ProjectBreakdown {
  projectId: string | null;
  projectName: string;
  color: string;
  completed: number;
  created: number;
  active: number;
}

interface DailyStats {
  id: string;
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  tasksActive: number;
  avgCompletionMs: number | null;
  byProject: ProjectBreakdown[] | null;
}

async function fetchAnalytics(days: number): Promise<DailyStats[]> {
  const res = await fetch(`/api/analytics?days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ChartSeries = "created" | "completed" | "both";
type AnalyticsTab = "overview" | "compare";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [range, setRange] = useState<TimeRange>("30d");
  const [chartSeries, setChartSeries] = useState<ChartSeries>("both");
  const { days, filterFn } = getDateRange(range);

  const staleTime = (range === "last_month" || range === "yesterday") ? Infinity : 1000 * 60 * 5;

  const { data: rawStats = [], isLoading } = useQuery({
    queryKey: ["analytics", days, range],
    queryFn: () => fetchAnalytics(days),
    staleTime,
  });

  const stats = useMemo(() => rawStats.filter((s) => filterFn(s.date)), [rawStats, filterFn]);

  const summary = useMemo(() => {
    if (stats.length === 0) return { totalCreated: 0, totalCompleted: 0, dailyAvg: 0 };

    const totalCreated = stats.reduce((sum, s) => sum + s.tasksCreated, 0);
    const totalCompleted = stats.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const dailyAvg = stats.length > 0 ? totalCompleted / stats.length : 0;

    return { totalCreated, totalCompleted, dailyAvg };
  }, [stats]);

  const chartData = useMemo(() => {
    return stats.map((s) => ({
      date: formatDate(s.date),
      completed: s.tasksCompleted,
      created: s.tasksCreated,
      active: s.tasksActive,
    }));
  }, [stats]);

  const projectBreakdown = useMemo(() => {
    const totals = new Map<string, { name: string; color: string; completed: number }>();
    for (const s of stats) {
      if (!s.byProject) continue;
      for (const p of s.byProject) {
        const key = p.projectId ?? "inbox";
        const existing = totals.get(key) ?? { name: p.projectName, color: p.color, completed: 0 };
        existing.completed += p.completed;
        totals.set(key, existing);
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.completed - a.completed);
  }, [stats]);

  return (
    <div className="min-h-screen bg-bg-primary overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-4xl mx-auto flex items-center gap-3 py-4">
          <Link
            href="/"
            className="text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
            aria-label="Back to tasks"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-text-primary" style={{ fontFamily: "var(--font-oswald)" }}>
            Analytics
          </h1>
        </div>
      </div>

      <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-4xl mx-auto py-6 space-y-6">
        {/* Tab Switcher */}
        <div className="flex bg-bg-secondary border border-border rounded-[4px] p-1 gap-1 w-fit">
          {(["overview", "compare"] as AnalyticsTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-1.5 text-xs font-medium rounded-[3px] transition-all duration-200 min-h-[36px] capitalize ${
                activeTab === tab
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab === "overview" ? "Overview" : "Compare"}
            </button>
          ))}
        </div>

        {activeTab === "compare" ? (
          <CompareTab />
        ) : (
          <div className="space-y-6">
            {/* Time Range Filter */}
            <div className="flex flex-wrap gap-1.5">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[3px] transition-all min-h-[32px] ${
                    range === r.value
                      ? "bg-accent text-white"
                      : "bg-bg-card border border-border text-text-muted hover:text-text-secondary hover:border-border-subtle"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
              </div>
            ) : stats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                  <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 16l4-4 4 4 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-text-muted text-sm text-center">
                  No analytics data yet.<br />Stats are collected daily — check back tomorrow.
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bg-card border border-border rounded-[4px] p-4">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Created</p>
                    <p className="text-2xl font-bold text-[#4A9EFF] mt-1">{summary.totalCreated}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">total</p>
                  </div>
                  <div className="bg-bg-card border border-border rounded-[4px] p-4">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold text-accent mt-1">{summary.totalCompleted}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">total</p>
                  </div>
                  <div className="bg-bg-card border border-border rounded-[4px] p-4">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Daily Avg</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{summary.dailyAvg.toFixed(1)}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">completed/day</p>
                  </div>
                </div>

                {/* Chart Series Toggle */}
                <div className="flex items-center justify-center">
                  <div className="flex bg-bg-secondary border border-border rounded-[4px] p-1 gap-1">
                    {(["created", "completed", "both"] as ChartSeries[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setChartSeries(s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-[3px] transition-all min-h-[36px] capitalize ${
                          chartSeries === s
                            ? "bg-accent text-white"
                            : "text-text-muted hover:text-text-secondary"
                        }`}
                      >
                        {s === "both" ? "Both" : s === "created" ? "Created" : "Completed"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Charts (lazy loaded) */}
                <OverviewCharts
                  chartData={chartData}
                  chartSeries={chartSeries}
                  projectBreakdown={projectBreakdown}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
