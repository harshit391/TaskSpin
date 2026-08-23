"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useProjects } from "@/hooks/useProjects";
import { getLocalDate } from "@/lib/api";
import { UserMenu } from "@/components/UserMenu";

export function HomeDashboard() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { habits, isLoading: habitsLoading, isMutating: habitsMutating, checkin, undoCheckin } = useHabits();
  const { projects } = useProjects();

  const today = getLocalDate();

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
    return { active, completedToday, projects: projects.length, habits: habits.filter((h) => !h.archived).length };
  }, [tasks, projects, habits, today]);

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
        <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-5xl mx-auto flex items-center justify-between h-14">
          <div />
          <UserMenu />
        </div>
      </header>

      <main className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-5xl mx-auto py-6 space-y-6">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active Tasks" value={stats.active} href="/dashboard" />
          <StatCard label="Done Today" value={stats.completedToday} href="/dashboard" />
          <StatCard label="Projects" value={stats.projects} href="/projects" />
          <StatCard label="Habits" value={stats.habits} href="/habits" />
        </div>

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
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card"
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
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-card"
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
                  className="p-3 rounded-lg border border-border bg-bg-card"
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

        {/* Quick Nav */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NavCard href="/dashboard" label="Tasks" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />
            <NavCard href="/habits" label="Habits" icon="M12 2c1 3 3.5 5 6 5-1 4-3 8-6 11-3-3-5-7-6-11 2.5 0 5-2 6-5z" />
            <NavCard href="/projects" label="Projects" icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            <NavCard href="/analytics" label="Analytics" icon="M3 3v18h18M7 16l4-4 4 4 5-5" />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a href={href} className="p-3 sm:p-4 rounded-xl border border-border bg-bg-card hover:border-accent/30 transition-colors">
      <p className="text-lg sm:text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
    </a>
  );
}

function NavCard({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-bg-card hover:border-accent/30 transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d={icon} />
        </svg>
      </div>
      <span className="text-sm font-medium text-text-primary">{label}</span>
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
