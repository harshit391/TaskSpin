"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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

function formatDuration(ms: number | null) {
  if (!ms) return "—";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(ms / (1000 * 60))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function AnalyticsPage() {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["analytics", 30],
    queryFn: () => fetchAnalytics(30),
  });

  const summary = useMemo(() => {
    if (stats.length === 0) return { totalCompleted: 0, dailyAvg: 0, streak: 0, avgTime: null as number | null };

    const totalCompleted = stats.reduce((sum, s) => sum + s.tasksCompleted, 0);
    const dailyAvg = stats.length > 0 ? totalCompleted / stats.length : 0;

    let streak = 0;
    for (let i = stats.length - 1; i >= 0; i--) {
      if (stats[i].tasksCompleted > 0) streak++;
      else break;
    }

    const avgTimes = stats.filter((s) => s.avgCompletionMs !== null).map((s) => s.avgCompletionMs!);
    const avgTime = avgTimes.length > 0 ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length : null;

    return { totalCompleted, dailyAvg, streak, avgTime };
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-[4px] p-4"
              >
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-accent mt-1">{summary.totalCompleted}</p>
                <p className="text-[10px] text-text-muted mt-0.5">last 30 days</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-bg-card border border-border rounded-[4px] p-4"
              >
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Daily Avg</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{summary.dailyAvg.toFixed(1)}</p>
                <p className="text-[10px] text-text-muted mt-0.5">tasks/day</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-bg-card border border-border rounded-[4px] p-4"
              >
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Streak</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{summary.streak}</p>
                <p className="text-[10px] text-text-muted mt-0.5">consecutive days</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-bg-card border border-border rounded-[4px] p-4"
              >
                <p className="text-[11px] text-text-muted uppercase tracking-wider">Avg Time</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{formatDuration(summary.avgTime)}</p>
                <p className="text-[10px] text-text-muted mt-0.5">to complete</p>
              </motion.div>
            </div>

            {/* Completion Trend */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5"
            >
              <p className="text-xs text-text-muted uppercase tracking-wider mb-4">Tasks Completed (30 days)</p>
              <div className="h-[200px] sm:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF2D6F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF2D6F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, fontSize: 12 }}
                      labelStyle={{ color: "#aaa" }}
                    />
                    <Area type="monotone" dataKey="completed" stroke="#FF2D6F" fill="url(#completedGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Created vs Completed */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5"
            >
              <p className="text-xs text-text-muted uppercase tracking-wider mb-4">Created vs Completed</p>
              <div className="h-[200px] sm:h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, fontSize: 12 }}
                      labelStyle={{ color: "#aaa" }}
                    />
                    <Bar dataKey="created" fill="#4A9EFF" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="completed" fill="#FF2D6F" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#4A9EFF]" /> Created
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FF2D6F]" /> Completed
                </span>
              </div>
            </motion.div>

            {/* Project Breakdown */}
            {projectBreakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5"
              >
                <p className="text-xs text-text-muted uppercase tracking-wider mb-4">By Project (completed)</p>
                <div className="space-y-2.5">
                  {projectBreakdown.map((p) => {
                    const maxCompleted = projectBreakdown[0]?.completed || 1;
                    const pct = (p.completed / maxCompleted) * 100;
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-sm text-text-secondary w-24 truncate">{p.name}</span>
                        <div className="flex-1 h-5 bg-bg-primary rounded-sm overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="h-full rounded-sm"
                            style={{ backgroundColor: p.color, opacity: 0.7 }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-8 text-right">{p.completed}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
