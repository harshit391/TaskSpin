"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { getLocalDate } from "@/lib/api";
import { SyncingOverlay } from "@/components/SyncingOverlay";

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA").format(d);
}

function formatDateLabel(dateStr: string): string {
  const today = getLocalDate();
  const tomorrow = getTomorrowDate();
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function PlanPage() {
  const { tasks, isLoading, isMutating, toggleTask, planForDate, unplan } = useTasks();
  const { projects } = useProjects();

  const today = getLocalDate();
  const tomorrow = getTomorrowDate();

  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState("");
  const [customDate, setCustomDate] = useState("");

  const plannedTasks = useMemo(() => {
    return tasks.filter((t) => t.plannedDate === selectedDate && !t.completed);
  }, [tasks, selectedDate]);

  const availableTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      if (t.plannedDate) return false;
      if (t.hiddenUntil && new Date(t.hiddenUntil) > new Date()) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, search]);

  const handleAddToPlan = (taskId: string) => {
    planForDate(taskId, selectedDate);
  };

  const handleCustomDate = (value: string) => {
    setCustomDate(value);
    if (value && value >= today) {
      setSelectedDate(value);
    }
  };

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
        <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-5xl mx-auto flex items-center gap-3 h-14">
          <a
            href="/"
            className="text-text-muted hover:text-text-primary transition-colors p-1"
            aria-label="Back to home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-base font-semibold text-text-primary">Plan My Day</h1>
        </div>
      </header>

      <main className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-5xl mx-auto py-6 space-y-6">
        {/* Date Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedDate(today); setCustomDate(""); }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedDate === today
                ? "bg-accent text-white"
                : "bg-bg-card border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => { setSelectedDate(tomorrow); setCustomDate(""); }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedDate === tomorrow
                ? "bg-accent text-white"
                : "bg-bg-card border border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Tomorrow
          </button>
          <input
            type="date"
            value={customDate}
            min={today}
            onChange={(e) => handleCustomDate(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-lg bg-bg-card border transition-colors outline-none ${
              customDate && selectedDate === customDate
                ? "border-accent text-text-primary"
                : "border-border text-text-secondary"
            }`}
          />
          {selectedDate !== today && selectedDate !== tomorrow && customDate && (
            <span className="text-xs text-text-muted">{formatDateLabel(selectedDate)}</span>
          )}
        </div>

        {/* Planned Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Planned for {formatDateLabel(selectedDate)}
            </h2>
            <span className="text-xs text-text-muted">{plannedTasks.length} task{plannedTasks.length !== 1 ? "s" : ""}</span>
          </div>

          {plannedTasks.length === 0 ? (
            <div className="p-6 rounded-xl border border-border/50 bg-bg-card/50 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted mx-auto mb-2">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-text-muted">No tasks planned yet</p>
              <p className="text-xs text-text-muted mt-1">Pick tasks from below to build your plan</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {plannedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border bg-bg-card"
                  >
                    <button
                      onClick={() => toggleTask(task.id, true)}
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-bg-hover border border-border hover:border-green-500/50 hover:bg-green-500/10 transition-all group"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{task.title}</p>
                      {task.project && (
                        <span className="inline-flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
                          <span className="text-[10px] text-text-muted">{task.project.name}</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => unplan(task.id)}
                      className="text-text-muted hover:text-error transition-colors p-1.5 flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                      title="Remove from plan"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Available Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Available Tasks</h2>
            <span className="text-xs text-text-muted">{availableTasks.length} available</span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-bg-card border border-border text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {availableTasks.length === 0 ? (
            <div className="p-4 rounded-lg border border-border/50 bg-bg-card/50 text-center">
              <p className="text-xs text-text-muted">{search ? "No matching tasks" : "All tasks are planned or completed"}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {availableTasks.map((task) => (
                <motion.button
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddToPlan(task.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-accent/30 hover:bg-bg-card text-left transition-all group"
                >
                  <div className="w-6 h-6 rounded-full border border-border group-hover:border-accent/50 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-secondary group-hover:text-text-primary truncate transition-colors">{task.title}</p>
                  </div>
                  {task.project && (
                    <span className="inline-flex items-center gap-1 flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
                      <span className="text-[10px] text-text-muted">{task.project.name}</span>
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </main>

      <SyncingOverlay show={isMutating} />
    </div>
  );
}
