"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useProjects } from "@/hooks/useProjects";
import { useRoadmaps } from "@/hooks/useRoadmaps";
import { getLocalDate } from "@/lib/api";
import { UserMenu } from "@/components/UserMenu";
import { SyncingOverlay } from "@/components/SyncingOverlay";

export function HomeDashboard() {
  const { tasks, isLoading: tasksLoading, toggleTask, unplan } = useTasks();
  const { habits, isLoading: habitsLoading, isMutating: habitsMutating, checkin, undoCheckin } = useHabits();
  const { projects } = useProjects();
  const { roadmaps } = useRoadmaps();

  const today = getLocalDate();

  const plannedToday = useMemo(() => {
    return tasks.filter((t) => t.plannedDate === today && !t.completed);
  }, [tasks, today]);

  const todayHabits = useMemo(() => {
    return habits.filter((h) => !h.archived);
  }, [habits]);

  const todayRecurring = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      if (!t.recurrenceType) return false;
      if (t.hiddenUntil && new Date(t.hiddenUntil) > new Date()) return false;
      return true;
    }).slice(0, 5);
  }, [tasks]);

  const topTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && !t.recurrenceType && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date()))
      .slice(0, 6);
  }, [tasks]);

  const isLoading = tasksLoading || habitsLoading;

  const stats = useMemo(() => {
    const active = tasks.filter((t) => !t.completed && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date())).length;
    const completedToday = tasks.filter((t) => t.completed && t.updatedAt && new Date(t.updatedAt).toISOString().split("T")[0] === today).length;
    const planned = tasks.filter((t) => t.plannedDate === today && !t.completed).length;
    return { active, completedToday, planned, projects: projects.length, roadmaps: roadmaps.length, habits: habits.filter((h) => !h.archived).length };
  }, [tasks, projects, roadmaps, habits, today]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg-primary flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
          <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-primary overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-5xl mx-auto flex items-center justify-end h-14">
          <UserMenu />
        </div>
      </header>

      <main className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-5xl mx-auto py-8 space-y-8">
        {/* Welcome Section */}
        <section className="py-4 sm:py-6">
          <h2 className="font-[family-name:var(--font-oswald)] text-3xl sm:text-4xl font-bold uppercase tracking-[0.02em] leading-none mb-2">
            Task<span className="text-accent">Spin</span>
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-md">
            Your tasks, habits, and projects — all in one place. Stay on track, build streaks, and get things done.
          </p>
        </section>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Planned" value={stats.planned} href="/plan" linkLabel="Plan" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <StatCard label="Active Tasks" value={stats.active} href="/dashboard" linkLabel="Tasks" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M9 12h6M9 16h4" />
          <StatCard label="Done Today" value={stats.completedToday} href="/analytics" linkLabel="Analytics" icon="M3 3v18h18M7 16l4-4 4 4 5-5" />
          <StatCard label="Projects" value={stats.projects} href="/projects" linkLabel="Projects" icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          <StatCard label="Roadmaps" value={stats.roadmaps} href="/roadmap" linkLabel="Roadmaps" icon="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          <StatCard label="Habits" value={stats.habits} href="/habits" linkLabel="Habits" icon="M12 2c1 3 3.5 5 6 5-1 4-3 8-6 11-3-3-5-7-6-11 2.5 0 5-2 6-5z" />
        </div>

        {/* Today's Plan */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Plan</h2>
            <a href="/plan" className="text-[11px] text-accent hover:text-accent/80 transition-colors">Plan my day</a>
          </div>
          {plannedToday.length === 0 ? (
            <EmptyCard message="No tasks planned for today" linkText="Plan your day" href="/plan" />
          ) : (
            <div className="space-y-2">
              {plannedToday.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border bg-bg-card"
                >
                  <button
                    onClick={() => toggleTask(task.id, true)}
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-hover border border-border hover:border-accent/50 transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-text-muted opacity-0 hover:opacity-100 transition-opacity">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{task.title}</p>
                  </div>
                  {task.project && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.project.color }} />
                  )}
                  <button
                    onClick={() => unplan(task.id)}
                    className="text-text-muted hover:text-text-primary transition-colors p-1 flex-shrink-0"
                    title="Remove from plan"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habits Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Habits</h2>
              <a href="/habits" className="text-[11px] text-accent hover:text-accent/80 transition-colors">View all</a>
            </div>
            {todayHabits.length === 0 ? (
              <EmptyCard message="No habits yet" linkText="Create one" href="/habits" />
            ) : (
              <div className="space-y-2">
                {todayHabits.slice(0, 5).map((habit) => {
                  const isChecked = habit.checkins.some((c) => c.date === today);
                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 rounded-lg border border-border bg-bg-card"
                    >
                      <button
                        onClick={() => isChecked ? undoCheckin(habit.id) : checkin(habit.id)}
                        disabled={habitsMutating}
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50 ${
                          isChecked
                            ? "bg-green-500/20 border border-green-500/50"
                            : "bg-bg-hover border border-border hover:border-accent/50"
                        }`}
                      >
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-green-400">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{habit.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-base">🔥</span>
                        <span className="text-sm font-bold text-text-primary">{habit.currentStreak}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recurring Tasks Due Today */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Recurring Today</h2>
              <a href="/dashboard" className="text-[11px] text-accent hover:text-accent/80 transition-colors">View all</a>
            </div>
            {todayRecurring.length === 0 ? (
              <EmptyCard message="No recurring tasks due" linkText="Manage tasks" href="/dashboard" />
            ) : (
              <div className="space-y-2">
                {todayRecurring.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border bg-bg-card"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-shrink-0">
                      <path d="M17 2l4 4-4 4" />
                      <path d="M3 11V9a4 4 0 014-4h14" />
                      <path d="M7 22l-4-4 4-4" />
                      <path d="M21 13v2a4 4 0 01-4 4H3" />
                    </svg>
                    <p className="text-sm text-text-primary truncate flex-1">{task.title}</p>
                    {task.project && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.project.color }} />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Roadmaps */}
        {roadmaps.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Roadmaps</h2>
              <a href="/roadmap" className="text-[11px] text-accent hover:text-accent/80 transition-colors">View all</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {roadmaps.slice(0, 6).map((roadmap) => {
                const roadmapTasks = tasks.filter((t) => t.roadmapId === roadmap.id);
                const total = roadmapTasks.length;
                const done = roadmapTasks.filter((t) => t.completed).length;
                const active = total - done;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <motion.a
                    key={roadmap.id}
                    href={`/dashboard?roadmap=${roadmap.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-border bg-bg-card hover:border-accent/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: roadmap.color }} />
                      <p className="text-sm font-medium text-text-primary truncate">{roadmap.title}</p>
                    </div>
                    <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden mb-1.5">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-text-muted">{active} remaining · {pct}% done</p>
                  </motion.a>
                );
              })}
            </div>
          </section>
        )}

        {/* Top Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Top Tasks</h2>
            <a href="/dashboard" className="text-[11px] text-accent hover:text-accent/80 transition-colors">View all</a>
          </div>
          {topTasks.length === 0 ? (
            <EmptyCard message="No active tasks" linkText="Add tasks" href="/dashboard" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {topTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-border bg-bg-card"
                >
                  <p className="text-sm text-text-primary truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {task.project && (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
                        <span className="text-[10px] text-text-muted truncate max-w-[80px]">{task.project.name}</span>
                      </span>
                    )}
                    {task.notes && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </main>

      <SyncingOverlay show={habitsMutating} />
    </div>
  );
}

function StatCard({ label, value, href, linkLabel, icon }: { label: string; value: number; href: string; linkLabel: string; icon: string }) {
  return (
    <a href={href} className="group relative p-4 sm:p-5 rounded-xl border border-border bg-bg-card hover:border-accent/30 transition-all overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-muted mt-1">{label}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d={icon} />
          </svg>
        </div>
      </div>
      {/* Desktop hover slide-up */}
      <div className="hidden sm:flex absolute bottom-0 left-0 right-0 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 bg-accent/10 border-t border-accent/20 px-4 py-2 items-center justify-between rounded-b-xl">
        <span className="text-[11px] font-medium text-accent">{linkLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      {/* Mobile: subtle arrow */}
      <div className="sm:hidden absolute top-4 right-4 opacity-30">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
          <path d="M7 17L17 7M17 7H7M17 7v10" />
        </svg>
      </div>
    </a>
  );
}

function EmptyCard({ message, linkText, href }: { message: string; linkText: string; href: string }) {
  return (
    <div className="p-4 rounded-lg border border-border/50 bg-bg-card/50 text-center">
      <p className="text-xs text-text-muted mb-1">{message}</p>
      <a href={href} className="text-xs text-accent hover:text-accent/80 transition-colors">{linkText}</a>
    </div>
  );
}
