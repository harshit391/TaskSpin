"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Task, Project } from "@/types/task";

interface TaskItemProps {
  task: Task;
  projects: Project[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, projectId: string | null) => void;
}

export function TaskItem({ task, projects, onToggle, onEdit, onDelete, onAssign }: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed);
    } else {
      setEditValue(task.title);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(task.title);
      setEditing(false);
    }
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
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
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full text-sm sm:text-base lg:text-lg bg-bg-primary border border-accent rounded-[3px] px-2 py-0.5 text-text-primary focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            onDoubleClick={() => { setEditValue(task.title); setEditing(true); }}
            className={`block text-left text-sm sm:text-base lg:text-lg transition-all w-full ${
              expanded ? "whitespace-normal break-words" : "truncate"
            } ${
              task.completed ? "line-through text-text-muted" : "text-text-primary"
            }`}
            title={expanded ? undefined : task.title}
            aria-label={expanded ? "Collapse task title" : "Expand task title"}
          >
            {task.title}
          </button>
        )}
        {task.project && !editing && (
          <span className="inline-flex items-center gap-1 mt-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-[11px] text-text-muted hidden sm:inline">
              {task.project.name}
            </span>
            <span className="text-[11px] text-text-muted truncate max-w-[100px] sm:hidden">
              {task.project.name}
            </span>
          </span>
        )}
      </div>

      {/* Edit Button */}
      <button
        onClick={() => { setEditValue(task.title); setEditing(true); }}
        aria-label={`Edit "${task.title}"`}
        className="flex-shrink-0 text-text-muted hover:text-accent transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

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
