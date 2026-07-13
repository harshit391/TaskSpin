"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Project } from "@/types/task";

interface SpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  onComplete: (id: string) => void;
  currentProjectFilter: string;
}

type SpinState = "idle" | "spinning" | "result";

export function SpinModal({ isOpen, onClose, tasks, projects, onComplete, currentProjectFilter }: SpinModalProps) {
  const [spinState, setSpinState] = useState<SpinState>("idle");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [scopeProjects, setScopeProjects] = useState<string[]>([]);
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get eligible tasks (incomplete only)
  const eligibleTasks = tasks.filter((t) => {
    if (t.completed) return false;
    if (scopeProjects.length === 0) return true;
    if (scopeProjects.includes("inbox") && t.projectId === null) return true;
    return scopeProjects.includes(t.projectId ?? "");
  });

  // Initialize scope from current project filter
  useEffect(() => {
    if (isOpen) {
      setSpinState("idle");
      setSelectedTask(null);
      if (currentProjectFilter === "all") {
        setScopeProjects([]);
      } else if (currentProjectFilter === "inbox") {
        setScopeProjects(["inbox"]);
      } else {
        setScopeProjects([currentProjectFilter]);
      }
    }
  }, [isOpen, currentProjectFilter]);

  // Shuffle display tasks for the spinning effect
  useEffect(() => {
    if (eligibleTasks.length > 0) {
      const shuffled = [...eligibleTasks].sort(() => Math.random() - 0.5);
      setDisplayedTasks(shuffled.length >= 8 ? shuffled.slice(0, 8) : shuffled);
    }
  }, [eligibleTasks.length, spinState === "idle"]);

  const startSpin = useCallback(() => {
    if (eligibleTasks.length === 0) return;

    setSpinState("spinning");
    setCurrentIndex(0);

    let speed = 60;
    let iterations = 0;
    const totalIterations = 25 + Math.floor(Math.random() * 10);

    const tick = () => {
      iterations++;
      setCurrentIndex((prev) => (prev + 1) % displayedTasks.length);

      if (iterations >= totalIterations) {
        if (intervalRef.current) clearTimeout(intervalRef.current);
        const winner = eligibleTasks[Math.floor(Math.random() * eligibleTasks.length)];
        setSelectedTask(winner);
        setSpinState("result");
        return;
      }

      // Decelerate
      speed = speed + (iterations / totalIterations) * 15;
      intervalRef.current = setTimeout(tick, speed);
    };

    intervalRef.current = setTimeout(tick, speed);
  }, [eligibleTasks, displayedTasks.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  const toggleScope = (id: string) => {
    setScopeProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-bg-card border border-border rounded-[4px] sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <h2 className="font-[family-name:var(--font-oswald)] text-xl font-semibold uppercase tracking-[0.02em]">
                Task<span className="text-accent">Spin</span>
              </h2>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px]"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-5 flex-1">
              {/* Scope selector */}
              {spinState === "idle" && (
                <div className="space-y-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
                    Pick from
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setScopeProjects([])}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        scopeProjects.length === 0
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-bg-secondary text-text-secondary hover:border-text-muted"
                      }`}
                    >
                      All Tasks
                    </button>
                    <button
                      onClick={() => toggleScope("inbox")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        scopeProjects.includes("inbox")
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border bg-bg-secondary text-text-secondary hover:border-text-muted"
                      }`}
                    >
                      Inbox
                    </button>
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => toggleScope(project.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          scopeProjects.includes(project.id)
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-bg-secondary text-text-secondary hover:border-text-muted"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Spin Area */}
              <div className="relative h-48 flex items-center justify-center overflow-hidden rounded-[4px] bg-bg-secondary border border-border">
                {spinState === "idle" && (
                  <div className="text-center space-y-2">
                    <p className="text-text-secondary text-sm">
                      {eligibleTasks.length > 0
                        ? `${eligibleTasks.length} task${eligibleTasks.length > 1 ? "s" : ""} ready`
                        : "No incomplete tasks in scope"}
                    </p>
                  </div>
                )}

                {spinState === "spinning" && displayedTasks.length > 0 && (
                  <div className="w-full px-4">
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={currentIndex}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0 }}
                        transition={{ duration: 0.08 }}
                        className="text-center py-3 px-4 bg-bg-hover rounded-[3px] border border-border"
                      >
                        <span className="text-sm sm:text-base text-text-primary truncate block">
                          {displayedTasks[currentIndex % displayedTasks.length]?.title}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                {spinState === "result" && selectedTask && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="w-full px-4"
                  >
                    <div className="text-center py-4 px-4 bg-accent/10 border-2 border-accent rounded-[4px] shadow-[0_0_30px_var(--color-accent-glow)]">
                      <span className="text-base sm:text-lg font-medium text-text-primary block">
                        {selectedTask.title}
                      </span>
                      {selectedTask.project && (
                        <span className="inline-flex items-center gap-1.5 mt-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTask.project.color }} />
                          <span className="text-xs text-text-muted">{selectedTask.project.name}</span>
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {spinState === "idle" && (
                  <button
                    onClick={startSpin}
                    disabled={eligibleTasks.length === 0}
                    className="flex-1 bg-accent hover:bg-accent-hover text-white text-sm font-medium uppercase tracking-[0.05em] px-6 py-3 rounded-[4px] transition-all hover:shadow-[0_0_20px_var(--color-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Spin!
                  </button>
                )}

                {spinState === "result" && (
                  <>
                    <button
                      onClick={() => {
                        setSpinState("idle");
                        setSelectedTask(null);
                      }}
                      className="flex-1 border border-border text-text-secondary hover:text-text-primary hover:border-text-muted text-sm font-medium uppercase tracking-[0.05em] px-4 py-3 rounded-[4px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Spin Again
                    </button>
                    <button
                      onClick={() => {
                        if (selectedTask) onComplete(selectedTask.id);
                        onClose();
                      }}
                      className="flex-1 bg-success hover:bg-success/80 text-white text-sm font-medium uppercase tracking-[0.05em] px-4 py-3 rounded-[4px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Mark Done
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
