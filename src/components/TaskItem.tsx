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
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [customDays, setCustomDays] = useState(task.recurrenceDays ?? 7);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const recurrenceMenuRef = useRef<HTMLDivElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
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
    if (!showOverflowMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setShowOverflowMenu(false);
        setShowMenu(false);
        setShowRecurrenceMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showOverflowMenu]);

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
    setShowOverflowMenu(false);
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
      className={`group flex items-center gap-2.5 sm:gap-4 bg-bg-card border rounded-[2px] px-3 py-2 sm:px-5 sm:py-3.5 transition-all select-none ${
        isSelected
          ? "border-accent/40 bg-accent/5"
          : "border-border/60 sm:border-border hover:border-border-subtle hover:bg-bg-hover"
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

      {/* Completion Checkbox */}
      <button
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.completed); }}
        className={`relative flex-shrink-0 w-[18px] h-[18px] sm:w-5 sm:h-5 border-2 rounded-[2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[44px] min-h-[44px] flex items-center justify-center ${
          task.completed
            ? "bg-accent border-accent"
            : "border-border hover:border-accent"
        }`}
      >
        {task.completed && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Title + Inline Badges */}
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
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!selectionActive) setExpanded(!expanded);
              }}
              onDoubleClick={() => { setEditValue(task.title); setEditing(true); }}
              className={`flex-1 min-w-0 text-left text-sm sm:text-base lg:text-lg transition-all ${
                expanded ? "whitespace-normal break-words" : "truncate"
              } ${
                task.completed ? "line-through text-text-muted" : "text-text-primary"
              }`}
              title={expanded ? undefined : task.title}
              aria-label={expanded ? "Collapse task title" : "Expand task title"}
            >
              {task.title}
            </button>
            {/* Inline badges (collapsed state only) */}
            {!expanded && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {task.project && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.project.color }}
                    title={task.project.name}
                  />
                )}
                {task.recurrenceType && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted flex-shrink-0" aria-hidden="true">
                    <path d="M17 2l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 014-4h14" />
                    <path d="M7 22l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                )}
              </div>
            )}
          </div>
        )}
        {/* Expanded detail badges */}
        {expanded && !editing && (
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {task.project && (
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.project.color }}
                />
                <span className="text-[11px] text-text-muted">
                  {task.project.name}
                </span>
              </span>
            )}
            {task.recurrenceType && (
              <span className="inline-flex items-center gap-0.5">
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

      {/* Action buttons */}
      {!selectionActive && (
        <>
          {/* Mobile: Overflow menu (⋮) */}
          <div
            className="relative flex-shrink-0 sm:hidden"
            ref={overflowMenuRef}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowOverflowMenu(!showOverflowMenu); }}
              aria-label="Task actions"
              className="text-text-muted hover:text-text-secondary transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            <AnimatePresence>
              {showOverflowMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.25 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-bg-card border border-border rounded-[4px] shadow-lg shadow-black/50 overflow-hidden"
                >
                  {/* Edit */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowOverflowMenu(false); setEditValue(task.title); setEditing(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left text-text-secondary hover:bg-bg-hover transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Edit task
                  </button>

                  <div className="h-px bg-border" />

                  {/* Move to project (accordion) */}
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowRecurrenceMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left text-text-secondary hover:bg-bg-hover transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="flex-1">Move to project</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${showMenu ? "rotate-90" : ""}`} aria-hidden="true">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="max-h-[200px] overflow-y-auto bg-bg-hover/20">
                            <button
                              onClick={(e) => { e.stopPropagation(); onAssign(task.id, null); setShowMenu(false); setShowOverflowMenu(false); }}
                              className={`w-full flex items-center gap-2 px-5 py-2 text-[11px] text-left transition-colors hover:bg-bg-hover ${
                                task.projectId === null ? "text-accent" : "text-text-secondary"
                              }`}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Inbox
                            </button>
                            {projects.map((project) => (
                              <button
                                key={project.id}
                                onClick={(e) => { e.stopPropagation(); onAssign(task.id, project.id); setShowMenu(false); setShowOverflowMenu(false); }}
                                className={`w-full flex items-center gap-2 px-5 py-2 text-[11px] text-left transition-colors hover:bg-bg-hover ${
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
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Set recurrence (accordion) */}
                  <div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowRecurrenceMenu(!showRecurrenceMenu); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left text-text-secondary hover:bg-bg-hover transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 2l4 4-4 4" />
                        <path d="M3 11V9a4 4 0 014-4h14" />
                        <path d="M7 22l-4-4 4-4" />
                        <path d="M21 13v2a4 4 0 01-4 4H3" />
                      </svg>
                      <span className="flex-1">Set recurrence</span>
                      {task.recurrenceType && (
                        <span className="text-[10px] text-accent mr-1">
                          {recurrenceLabel(task.recurrenceType, task.recurrenceDays)}
                        </span>
                      )}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${showRecurrenceMenu ? "rotate-90" : ""}`} aria-hidden="true">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {showRecurrenceMenu && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-bg-hover/20">
                            {RECURRENCE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={(e) => { e.stopPropagation(); handleRecurrenceSelect(opt.value); }}
                                className={`w-full flex items-center gap-2 px-5 py-2 text-[11px] text-left transition-colors hover:bg-bg-hover ${
                                  task.recurrenceType === opt.value ? "text-accent" : "text-text-secondary"
                                }`}
                              >
                                {opt.label}
                                {opt.value === "custom" && task.recurrenceType === "custom" && (
                                  <span className="text-text-muted ml-auto">{task.recurrenceDays}d</span>
                                )}
                              </button>
                            ))}
                            <div className="px-5 py-2 border-t border-border flex items-center gap-1.5">
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
                                onClick={(e) => { e.stopPropagation(); onSetRecurrence(task.id, "custom", customDays); setShowRecurrenceMenu(false); setShowOverflowMenu(false); }}
                                className="ml-auto text-[10px] font-medium text-accent hover:text-accent-hover"
                              >
                                Set
                              </button>
                            </div>
                            {task.recurrenceType && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onSetRecurrence(task.id, null); setShowRecurrenceMenu(false); setShowOverflowMenu(false); }}
                                className="w-full flex items-center gap-2 px-5 py-2 text-[11px] text-left transition-colors hover:bg-bg-hover text-error border-t border-border"
                              >
                                Remove recurrence
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowOverflowMenu(false); onDelete(task.id); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left text-error hover:bg-error/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete task
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop: Individual action buttons (hover-reveal) */}
          <div className="hidden sm:contents">
            {/* Edit Button */}
            <button
              onClick={(e) => { e.stopPropagation(); setEditValue(task.title); setEditing(true); }}
              aria-label={`Edit "${task.title}"`}
              className="flex-shrink-0 text-text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
                className="text-text-muted hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
                className={`transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center ${
                  task.recurrenceType ? "text-accent !opacity-100" : "text-text-muted hover:text-text-secondary"
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
              className="flex-shrink-0 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
