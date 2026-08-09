"use client";

import { motion } from "framer-motion";
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

type ChartSeries = "created" | "completed" | "both";

interface ChartDataPoint {
  date: string;
  completed: number;
  created: number;
  active: number;
}

interface ProjectBreakdownItem {
  name: string;
  color: string;
  completed: number;
}

interface OverviewChartsProps {
  chartData: ChartDataPoint[];
  chartSeries: ChartSeries;
  projectBreakdown: ProjectBreakdownItem[];
}

export function OverviewCharts({ chartData, chartSeries, projectBreakdown }: OverviewChartsProps) {
  return (
    <>
      {/* Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5"
      >
        <p className="text-xs text-text-muted uppercase tracking-wider mb-4">
          {chartSeries === "both" ? "Created vs Completed (Trend)" : chartSeries === "created" ? "Tasks Created" : "Tasks Completed"}
        </p>
        <div className="h-[200px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF2D6F" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF2D6F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4A9EFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4A9EFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, fontSize: 12 }}
                labelStyle={{ color: "#aaa" }}
              />
              {(chartSeries === "created" || chartSeries === "both") && (
                <Area type="monotone" dataKey="created" stroke="#4A9EFF" fill="url(#createdGradient)" strokeWidth={2} />
              )}
              {(chartSeries === "completed" || chartSeries === "both") && (
                <Area type="monotone" dataKey="completed" stroke="#FF2D6F" fill="url(#completedGradient)" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5"
      >
        <p className="text-xs text-text-muted uppercase tracking-wider mb-4">
          {chartSeries === "both" ? "Created vs Completed" : chartSeries === "created" ? "Tasks Created" : "Tasks Completed"}
        </p>
        <div className="h-[200px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, fontSize: 12 }}
                labelStyle={{ color: "#aaa" }}
              />
              {(chartSeries === "created" || chartSeries === "both") && (
                <Bar dataKey="created" fill="#4A9EFF" radius={[2, 2, 0, 0]} />
              )}
              {(chartSeries === "completed" || chartSeries === "both") && (
                <Bar dataKey="completed" fill="#FF2D6F" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          {(chartSeries === "created" || chartSeries === "both") && (
            <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#4A9EFF]" /> Created
            </span>
          )}
          {(chartSeries === "completed" || chartSeries === "both") && (
            <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FF2D6F]" /> Completed
            </span>
          )}
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
  );
}
