"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";
import { useQuery } from "@tanstack/react-query";

interface TaskPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (taskId: string) => void;
  excludeTaskIds: string[];
  contextProjectId?: string | null;
  isMoving?: boolean;
}

async function fetchAllTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks?all=true");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export function TaskPickerModal({ isOpen, onClose, onSelect, excludeTaskIds, contextProjectId, isMoving }: TaskPickerModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: fetchAllTasks,
    enabled: isOpen,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const filteredTasks = useMemo(() => {
    const excludeSet = new Set(excludeTaskIds);
    const query = search.toLowerCase().trim();

    const filtered = allTasks.filter((t) => {
      if (excludeSet.has(t.id)) return false;
      if (query && !t.title.toLowerCase().includes(query)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      // Active tasks first, completed last
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Same project as context first
      if (contextProjectId) {
        const aMatch = a.projectId === contextProjectId ? 0 : 1;
        const bMatch = b.projectId === contextProjectId ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      return 0;
    });

    return filtered;
  }, [allTasks, excludeTaskIds, search, contextProjectId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onKeyDown={handleKeyDown}
            className="fixed inset-x-3 top-[6%] bottom-[6%] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[60] bg-bg-card border border-border rounded-[4px] sm:w-full sm:max-w-md sm:h-[70vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-[0.08em] font-medium mb-1">
                  Attach existing task
                </p>
                <p className="text-sm text-text-primary font-medium">
                  Select a task to add to the chain
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-3 text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-border">
              <div className="relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full text-sm bg-bg-primary border border-border rounded-[3px] pl-9 pr-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Task List */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2">
              {(isMoving || isLoading) && (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                </div>
              )}
              {!isMoving && !isLoading && filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <p className="text-text-muted text-sm text-center">
                    {search ? "No matching tasks found" : "No available tasks"}
                  </p>
                </div>
              )}
              {!isMoving && !isLoading && filteredTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onSelect(task.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-[3px] text-left hover:bg-accent/10 transition-colors min-h-[44px] group ${task.completed ? "opacity-50" : ""}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${task.completed ? "bg-text-muted group-hover:bg-text-secondary" : "bg-accent/60 group-hover:bg-accent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${task.completed ? "text-text-muted line-through" : "text-text-primary"}`}>{task.title}</p>
                    {task.project && (
                      <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: task.project.color }}
                        />
                        {task.project.name}
                      </p>
                    )}
                  </div>
                  {task.sourceTaskId && (
                    <span className="text-[10px] text-text-muted bg-border/50 px-1.5 py-0.5 rounded flex-shrink-0">
                      In chain
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
