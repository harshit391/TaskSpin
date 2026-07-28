"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Project } from "@/types/task";
import { recurrenceLabel } from "@/lib/recurrence";

interface TaskItemProps {
  task: Task;
  projects: Project[];
  isSelected: boolean;
  selectionActive: boolean;
  onToggleSelect: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, projectId: string | null) => void;
  onSetRecurrence: (id: string, recurrenceType: string | null, recurrenceDays?: number) => void;
}

const RECURRENCE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "custom", label: "Custom" },
] as const;

export function TaskItem({
  task,
  projects,
  isSelected,
  selectionActive,
  onToggleSelect,
  onToggle,
  onEdit,
  onDelete,
  onAssign,
  onSetRecurrence,
}: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);
  const [customDays, setCustomDays] = useState(task.recurrenceDays ?? 7);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const recurrenceMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

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
    if (!showRecurrenceMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (recurrenceMenuRef.current && !recurrenceMenuRef.current.contains(e.target as Node)) {
        setShowRecurrenceMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showRecurrenceMenu]);

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

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(() => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onToggleSelect(task.id);
    }, 500);
  }, [task.id, onToggleSelect]);

  const handlePointerUp = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const handleClick = useCallback(() => {
    if (selectionActive && !longPressFired.current) {
      onToggleSelect(task.id);
    }
  }, [selectionActive, task.id, onToggleSelect]);

  const handleRecurrenceSelect = (type: string) => {
    if (type === "custom") {
      onSetRecurrence(task.id, "custom", customDays);
    } else {
      onSetRecurrence(task.id, type);
    }
    setShowRecurrenceMenu(false);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={clearLongPress}
      onClick={handleClick}
      className={`group flex items-start sm:items-center gap-3 sm:gap-4 bg-bg-card border rounded-[2px] p-3.5 sm:p-5 transition-all select-none ${
        isSelected
          ? "border-accent/40 bg-accent/5"
          : "border-border hover:border-border-subtle hover:bg-bg-hover"
      } ${task.completed ? "opacity-50" : ""}`}
    >
      {/* Selection Checkbox (circular, distinct from completion) */}
      <AnimatePresence>
        {selectionActive && (
          <motion.button
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
            aria-label={`Select "${task.title}"`}
            className={`flex-shrink-0 w-5 h-5 border-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-w-[44px] min-h-[44px] flex items-center justify-center overflow-hidden ${
              isSelected
                ? "bg-blue-500 border-blue-500"
                : "border-border-subtle hover:border-blue-400"
            }`}
          >
            {isSelected && (
              <span className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Custom Checkbox (Completion) */}
      <button
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.completed); }}
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

      {/* Title + Project Badge + Recurrence Badge */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm sm:text-base lg:text-lg bg-bg-primary border border-accent rounded-[3px] px-2 py-0.5 text-text-primary focus:outline-none"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!selectionActive) setExpanded(!expanded);
            }}
            onDoubleClick={() => { setEditValue(task.title); setEditing(true); }}
            className={`block text-left text-sm sm:text-base lg:text-lg transition-all w-full ${
              expanded ? "whitespace-normal break-words" : "line-clamp-2 sm:line-clamp-1"
            } ${
              task.completed ? "line-through text-text-muted" : "text-text-primary"
            }`}
            title={expanded ? undefined : task.title}
            aria-label={expanded ? "Collapse task title" : "Expand task title"}
          >
            {task.title}
          </button>
        )}
        {!editing && (
          <div className="flex items-center gap-2 flex-wrap">
            {task.project && (
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
            {task.recurrenceType && (
              <span className="inline-flex items-center gap-0.5 mt-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <path d="M17 2l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <path d="M7 22l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                <span className="text-[10px] text-text-muted">
                  {recurrenceLabel(task.recurrenceType, task.recurrenceDays)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons - hidden during selection mode on mobile */}
      {!selectionActive && (
        <>
          {/* Edit Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setEditValue(task.title); setEditing(true); }}
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
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
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
                <button
                  onClick={(e) => { e.stopPropagation(); onAssign(task.id, null); setShowMenu(false); }}
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
                    onClick={(e) => { e.stopPropagation(); onAssign(task.id, project.id); setShowMenu(false); }}
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

          {/* Recurrence button */}
          <div className="relative flex-shrink-0" ref={recurrenceMenuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowRecurrenceMenu(!showRecurrenceMenu); }}
              aria-label="Set recurrence"
              className={`transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center ${
                task.recurrenceType ? "text-accent" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11V9a4 4 0 014-4h14" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 01-4 4H3" />
              </svg>
            </button>

            {showRecurrenceMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-40 min-w-[150px] bg-bg-card border border-border rounded-[4px] shadow-lg overflow-hidden"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRecurrenceSelect(opt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover ${
                      task.recurrenceType === opt.value ? "text-accent" : "text-text-secondary"
                    }`}
                  >
                    {opt.label}
                    {opt.value === "custom" && task.recurrenceType === "custom" && (
                      <span className="text-text-muted ml-auto">{task.recurrenceDays}d</span>
                    )}
                  </button>
                ))}

                {/* Custom days input */}
                <div className="px-3 py-2 border-t border-border flex items-center gap-1.5">
                  <span className="text-[11px] text-text-muted">Every</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 text-center text-[11px] bg-bg-primary border border-border rounded-[3px] px-1 py-0.5 text-text-primary focus:outline-none focus:border-accent"
                  />
                  <span className="text-[11px] text-text-muted">days</span>
                  <button
                    onClick={() => { onSetRecurrence(task.id, "custom", customDays); setShowRecurrenceMenu(false); }}
                    className="ml-auto text-[10px] font-medium text-accent hover:text-accent-hover"
                  >
                    Set
                  </button>
                </div>

                {task.recurrenceType && (
                  <>
                    <div className="h-px bg-border" />
                    <button
                      onClick={() => { onSetRecurrence(task.id, null); setShowRecurrenceMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover text-error"
                    >
                      Remove recurrence
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            aria-label={`Delete "${task.title}"`}
            className="flex-shrink-0 text-text-muted hover:text-error transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </motion.div>
  );
}
