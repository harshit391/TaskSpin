"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Project } from "@/types/task";
import { recurrenceLabel, DAY_SHORT } from "@/lib/recurrence";

export interface TaskItemProps {
  task: Task;
  projects: Project[];
  isSelected: boolean;
  selectionActive: boolean;
  hasFollowUps?: boolean;
  chainCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isFollowUp?: boolean;
  onToggleSelect: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, title: string) => void;
  onEditNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, projectId: string | null) => void;
  onSetRecurrence: (id: string, recurrenceType: string | null, recurrenceDays?: number, recurrenceStartDate?: string | null, recurrenceWeekdays?: string | null) => void;
  onOpenFollowUps?: (id: string) => void;
}

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
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
  hasFollowUps,
  chainCount,
  isExpanded,
  onToggleExpand,
  isFollowUp,
  onToggleSelect,
  onToggle,
  onEdit,
  onEditNotes,
  onDelete,
  onAssign,
  onSetRecurrence,
  onOpenFollowUps,
}: TaskItemProps) {
  const isFutureScheduled = !task.completed && !!task.hiddenUntil && new Date(task.hiddenUntil) > new Date();
  const [showMenu, setShowMenu] = useState(false);
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [customDays, setCustomDays] = useState(task.recurrenceDays ?? 7);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(
    task.recurrenceWeekdays ? task.recurrenceWeekdays.split(",").map(Number) : []
  );
  const [startDate, setStartDate] = useState(task.recurrenceStartDate ? task.recurrenceStartDate.split("T")[0] : "");
  const [expanded, setExpanded] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [notesValue, setNotesValue] = useState(task.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    if (!editingNotes) {
      setNotesValue(task.notes ?? "");
    }
  }, [task.notes, editingNotes]);

  const NOTES_WORD_LIMIT = 250;
  const notesWordCount = notesValue.trim() ? notesValue.trim().split(/\s+/).length : 0;
  const notesOverLimit = notesWordCount > NOTES_WORD_LIMIT;

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    if (words <= NOTES_WORD_LIMIT) {
      setNotesValue(val);
    }
  }, []);

  const handleNotesSave = useCallback(() => {
    setEditingNotes(false);
    const trimmed = notesValue.trim();
    if (trimmed !== (task.notes ?? "").trim()) {
      onEditNotes(task.id, trimmed);
    }
  }, [notesValue, task.notes, task.id, onEditNotes]);

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
    if (longPressFired.current) return;
    if (selectionActive) {
      onToggleSelect(task.id);
    } else {
      setExpanded((prev) => !prev);
    }
  }, [selectionActive, task.id, onToggleSelect]);

  const handleRecurrenceSelect = (type: string) => {
    const sd = startDate || null;
    if (type === "custom") {
      if (selectedWeekdays.length > 0) {
        onSetRecurrence(task.id, "custom", undefined, sd, selectedWeekdays.sort((a, b) => a - b).join(","));
      } else {
        onSetRecurrence(task.id, "custom", customDays, sd, null);
      }
    } else {
      onSetRecurrence(task.id, type, undefined, sd, null);
    }
    setShowRecurrenceMenu(false);
    setShowOverflowMenu(false);
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <>
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
      className={`relative group flex items-start sm:items-center gap-2.5 sm:gap-4 bg-bg-card border rounded-[2px] transition-all select-none ${
        isFollowUp ? "px-2 py-1.5 sm:px-4 sm:py-2.5" : "px-3 py-2.5 sm:px-5 sm:py-3.5"
      } ${
        isSelected
          ? "border-accent/40 bg-accent/5"
          : "border-border/60 sm:border-border hover:border-border-subtle hover:bg-bg-hover"
      } ${task.completed ? "opacity-50" : isFutureScheduled ? "opacity-60" : ""}`}
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
        disabled={isFutureScheduled}
        aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isFutureScheduled) return;
          if (!task.completed) {
            setShowCompleteConfirm(true);
          } else {
            onToggle(task.id, false);
          }
        }}
        className={`relative flex-shrink-0 w-[18px] h-[18px] sm:w-5 sm:h-5 border-2 rounded-[2px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent flex items-center justify-center ${
          isFollowUp ? "min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px]" : "min-w-[44px] min-h-[44px]"
        } ${
          isFutureScheduled
            ? "border-border/40 cursor-not-allowed"
            : task.completed
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

      {/* Complete Confirmation */}
      <AnimatePresence>
        {showCompleteConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-bg-card border border-border rounded-[4px] shadow-lg px-4 py-3 flex flex-col items-center gap-2.5 min-w-[200px]"
          >
            <p className="text-xs text-text-secondary text-center">Mark as complete?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCompleteConfirm(false); onToggle(task.id, true); }}
                className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3.5 py-1.5 rounded-[3px] transition-colors min-h-[36px]"
              >
                Yes
              </button>
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="bg-bg-primary border border-border text-text-secondary text-xs font-medium px-3.5 py-1.5 rounded-[3px] hover:bg-bg-hover transition-colors min-h-[36px]"
              >
                No
              </button>
            </div>
          </motion.div>
        )}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-bg-card border border-border rounded-[4px] shadow-lg px-4 py-3 flex flex-col items-center gap-2.5 min-w-[200px]"
          >
            <p className="text-xs text-text-secondary text-center">Delete this task?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); onDelete(task.id); }}
                className="bg-error hover:bg-error/80 text-white text-xs font-medium px-3.5 py-1.5 rounded-[3px] transition-colors min-h-[36px]"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-bg-primary border border-border text-text-secondary text-xs font-medium px-3.5 py-1.5 rounded-[3px] hover:bg-bg-hover transition-colors min-h-[36px]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <>
            <div className="flex items-start gap-1 w-full">
              <div
                onDoubleClick={(e) => { e.stopPropagation(); if (!selectionActive) { setEditValue(task.title); setEditing(true); } }}
                title={!expanded ? task.title : undefined}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <motion.div
                  initial={false}
                  animate={{ height: expanded ? "auto" : "1.5em" }}
                  transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
                  className="overflow-hidden"
                >
                  <p className={`text-sm sm:text-base lg:text-lg whitespace-normal break-words ${
                    task.completed ? "line-through text-text-muted" : "text-text-primary"
                  }`}>
                    {task.title}
                  </p>
                </motion.div>
              </div>
            </div>
            {/* Project badge + recurrence + next date + notes indicator (always visible below title) */}
            {(task.project || task.recurrenceType || isFutureScheduled || task.notes) && (
              <div className="flex items-center gap-2 mt-0.5">
                {task.project && (
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.project.color }}
                    />
                    <span className="text-[11px] text-text-muted truncate max-w-[120px]">
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
                      {recurrenceLabel(task.recurrenceType, task.recurrenceDays, task.recurrenceWeekdays)}
                    </span>
                  </span>
                )}
                {isFutureScheduled && task.hiddenUntil && (
                  <span className="inline-flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent/70">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span className="text-[10px] text-accent/70 font-medium">
                      next: {new Date(task.hiddenUntil).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </span>
                )}
                {task.notes && !expanded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowNotesModal(true); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 hover:text-accent transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {/* Notes textarea (visible when expanded) */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-1 mt-1.5">
                    <textarea
                      ref={notesRef}
                      value={notesValue}
                      onChange={handleNotesChange}
                      onFocus={() => setEditingNotes(true)}
                      onBlur={handleNotesSave}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder="Add notes..."
                      rows={2}
                      className="flex-1 resize-none bg-transparent border-none text-xs sm:text-sm text-text-secondary placeholder:text-text-muted/50 focus:outline-none leading-relaxed p-0"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowNotesModal(true); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      aria-label="Expand notes"
                      className="flex-shrink-0 text-text-muted hover:text-accent transition-colors mt-0.5 p-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </button>
                  </div>
                  {notesWordCount >= NOTES_WORD_LIMIT - 20 && (
                    <p className={`text-[10px] mt-0.5 ${notesOverLimit ? "text-error" : "text-text-muted"}`}>
                      {notesWordCount}/{NOTES_WORD_LIMIT} words
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
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
                          {recurrenceLabel(task.recurrenceType, task.recurrenceDays, task.recurrenceWeekdays)}
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
                                onClick={(e) => { e.stopPropagation(); if (opt.value !== "custom") handleRecurrenceSelect(opt.value); }}
                                className={`w-full flex items-center gap-2 px-5 py-2 text-[11px] text-left transition-colors hover:bg-bg-hover ${
                                  task.recurrenceType === opt.value ? "text-accent" : "text-text-secondary"
                                }`}
                              >
                                {opt.label}
                                {opt.value === "custom" && task.recurrenceType === "custom" && !task.recurrenceWeekdays && (
                                  <span className="text-text-muted ml-auto">{task.recurrenceDays}d</span>
                                )}
                                {opt.value === "custom" && task.recurrenceType === "custom" && task.recurrenceWeekdays && (
                                  <span className="text-text-muted ml-auto">{recurrenceLabel("custom", null, task.recurrenceWeekdays)}</span>
                                )}
                              </button>
                            ))}
                            {/* Custom: Every N days */}
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
                                onClick={(e) => { e.stopPropagation(); setSelectedWeekdays([]); onSetRecurrence(task.id, "custom", customDays, startDate || null, null); setShowRecurrenceMenu(false); setShowOverflowMenu(false); }}
                                className="ml-auto text-[10px] font-medium text-accent hover:text-accent-hover"
                              >
                                Set
                              </button>
                            </div>
                            {/* Custom: Specific weekdays */}
                            <div className="px-5 py-2 border-t border-border space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-text-muted">On days</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (selectedWeekdays.length > 0) { onSetRecurrence(task.id, "custom", undefined, startDate || null, selectedWeekdays.sort((a, b) => a - b).join(",")); setShowRecurrenceMenu(false); setShowOverflowMenu(false); } }}
                                  className={`text-[10px] font-medium ${selectedWeekdays.length > 0 ? "text-accent hover:text-accent-hover" : "text-text-muted cursor-not-allowed"}`}
                                >
                                  Set
                                </button>
                              </div>
                              <div className="flex gap-1">
                                {DAY_SHORT.map((label, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); toggleWeekday(i); }}
                                    className={`w-7 h-7 rounded-full text-[10px] font-medium transition-all ${
                                      selectedWeekdays.includes(i)
                                        ? "bg-accent text-white"
                                        : "bg-bg-secondary border border-border text-text-muted hover:border-accent"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="px-5 py-2 border-t border-border flex items-center gap-1.5">
                              <span className="text-[11px] text-text-muted">From</span>
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 text-[11px] bg-bg-primary border border-border rounded-[3px] px-1.5 py-0.5 text-text-primary focus:outline-none focus:border-accent"
                              />
                              {startDate && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setStartDate(""); }}
                                  className="text-[10px] text-text-muted hover:text-text-secondary"
                                >
                                  Clear
                                </button>
                              )}
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

                  {!isFollowUp && <div className="h-px bg-border" />}

                  {/* Follow-ups */}
                  {!isFollowUp && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOverflowMenu(false);
                        if (chainCount && chainCount > 0 && onToggleExpand) {
                          onToggleExpand();
                        } else {
                          onOpenFollowUps?.(task.id);
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left transition-colors hover:bg-bg-hover ${hasFollowUps || (chainCount && chainCount > 0) ? "text-accent" : "text-text-secondary"}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      {chainCount && chainCount > 0
                        ? (isExpanded ? "Collapse chain" : `Expand chain (${chainCount})`)
                        : "Follow-ups"
                      }
                    </button>
                  )}

                  <div className="h-px bg-border" />

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowOverflowMenu(false); setShowDeleteConfirm(true); }}
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

          {/* Desktop: Individual action buttons (always visible) */}
          <div className="hidden sm:contents">
            {/* Edit Button */}
            <button
              onClick={(e) => { e.stopPropagation(); setEditValue(task.title); setEditing(true); }}
              aria-label={`Edit "${task.title}"`}
              className="flex-shrink-0 text-text-muted hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
                className="text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
                className={`transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center ${
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
                      onClick={() => { if (opt.value !== "custom") handleRecurrenceSelect(opt.value); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-bg-hover ${
                        task.recurrenceType === opt.value ? "text-accent" : "text-text-secondary"
                      }`}
                    >
                      {opt.label}
                      {opt.value === "custom" && task.recurrenceType === "custom" && !task.recurrenceWeekdays && (
                        <span className="text-text-muted ml-auto">{task.recurrenceDays}d</span>
                      )}
                      {opt.value === "custom" && task.recurrenceType === "custom" && task.recurrenceWeekdays && (
                        <span className="text-text-muted ml-auto">{recurrenceLabel("custom", null, task.recurrenceWeekdays)}</span>
                      )}
                    </button>
                  ))}

                  {/* Custom: Every N days */}
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
                      onClick={() => { setSelectedWeekdays([]); onSetRecurrence(task.id, "custom", customDays, startDate || null, null); setShowRecurrenceMenu(false); }}
                      className="ml-auto text-[10px] font-medium text-accent hover:text-accent-hover"
                    >
                      Set
                    </button>
                  </div>

                  {/* Custom: Specific weekdays */}
                  <div className="px-3 py-2 border-t border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-text-muted">On days</span>
                      <button
                        onClick={() => { if (selectedWeekdays.length > 0) { onSetRecurrence(task.id, "custom", undefined, startDate || null, selectedWeekdays.sort((a, b) => a - b).join(",")); setShowRecurrenceMenu(false); } }}
                        className={`text-[10px] font-medium ${selectedWeekdays.length > 0 ? "text-accent hover:text-accent-hover" : "text-text-muted cursor-not-allowed"}`}
                      >
                        Set
                      </button>
                    </div>
                    <div className="flex gap-1">
                      {DAY_SHORT.map((label, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); toggleWeekday(i); }}
                          className={`w-6 h-6 rounded-full text-[10px] font-medium transition-all ${
                            selectedWeekdays.includes(i)
                              ? "bg-accent text-white"
                              : "bg-bg-secondary border border-border text-text-muted hover:border-accent"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-3 py-2 border-t border-border flex items-center gap-1.5">
                    <span className="text-[11px] text-text-muted">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-[11px] bg-bg-primary border border-border rounded-[3px] px-1.5 py-0.5 text-text-primary focus:outline-none focus:border-accent"
                    />
                    {startDate && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setStartDate(""); }}
                        className="text-[10px] text-text-muted hover:text-text-secondary"
                      >
                        Clear
                      </button>
                    )}
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

            {/* Follow-ups Button */}
            {!isFollowUp && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (chainCount && chainCount > 0 && onToggleExpand) {
                    onToggleExpand();
                  } else {
                    onOpenFollowUps?.(task.id);
                  }
                }}
                aria-label={chainCount ? `${isExpanded ? "Collapse" : "Expand"} ${chainCount} follow-ups` : "Follow-up chain"}
                className={`relative flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center ${
                  hasFollowUps || (chainCount && chainCount > 0) ? "text-accent" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                {chainCount && chainCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {chainCount}
                  </span>
                ) : null}
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              aria-label={`Delete "${task.title}"`}
              className="flex-shrink-0 text-text-muted hover:text-error transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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

    {/* Notes Modal */}
    <AnimatePresence>
      {showNotesModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { handleNotesSave(); setShowNotesModal(false); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-bg-secondary border border-border rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary truncate flex-1 mr-3">{task.title}</h3>
              <button
                onClick={() => { handleNotesSave(); setShowNotesModal(false); }}
                className="text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                aria-label="Close notes"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={notesValue}
              onChange={handleNotesChange}
              onFocus={() => setEditingNotes(true)}
              placeholder="Add notes..."
              className="flex-1 min-h-[200px] w-full resize-none bg-bg-primary border border-border rounded-lg p-3 text-sm sm:text-base text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <p className={`text-[11px] ${notesOverLimit ? "text-error" : "text-text-muted"}`}>
                {notesWordCount}/{NOTES_WORD_LIMIT} words
              </p>
              <button
                onClick={() => { handleNotesSave(); setShowNotesModal(false); }}
                className="text-xs font-medium text-accent hover:text-accent/80 transition-colors min-h-[36px] px-3"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
