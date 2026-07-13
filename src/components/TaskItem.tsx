"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Task, Project } from "@/types/task";

interface TaskItemProps {
  task: Task;
  projects: Project[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, projectId: string | null) => void;
}

export function TaskItem({ task, projects, onToggle, onDelete, onAssign }: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
      className={`group flex items-center gap-3 sm:gap-4 bg-bg-card border border-border rounded-[2px] p-3.5 sm:p-5 transition-all hover:border-border-subtle hover:bg-bg-hover ${
        task.completed ? "opacity-50" : ""
      }`}
    >
      {/* Custom Checkbox */}
      <button
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        onClick={() => onToggle(task.id, !task.completed)}
        className={`relative flex-shrink-0 w-5 h-5 border-2 rounded-[2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[44px] min-h-[44px] flex items-center justify-center ${
          task.completed
            ? "bg-accent border-accent"
            : "border-border hover:border-accent"
        }`}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Title + Project Badge */}
      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm sm:text-base lg:text-lg transition-all truncate ${
            task.completed ? "line-through text-text-muted" : "text-text-primary"
          }`}
        >
          {task.title}
        </span>
        {task.project && (
          <span className="inline-flex items-center gap-1 mt-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-[11px] text-text-muted truncate max-w-[120px] hidden sm:inline">
              {task.project.name}
            </span>
          </span>
        )}
      </div>

      {/* Move to project button */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Move to project"
          className="text-text-muted hover:text-text-secondary transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute right-0 top-full mt-1 z-40 min-w-[160px] bg-bg-card border border-border rounded-[4px] shadow-lg overflow-hidden"
          >
            {/* No project / Inbox */}
            <button
              onClick={() => { onAssign(task.id, null); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover ${
                task.projectId === null ? "text-accent" : "text-text-secondary"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Inbox
            </button>

            {projects.length > 0 && <div className="h-px bg-border" />}

            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => { onAssign(task.id, project.id); setShowMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover ${
                  task.projectId === project.id ? "text-accent" : "text-text-secondary"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(task.id)}
        aria-label={`Delete "${task.title}"`}
        className="flex-shrink-0 text-text-muted hover:text-error transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </motion.div>
  );
}
