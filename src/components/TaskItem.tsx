"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Project } from "@/types/task";
import { recurrenceLabel } from "@/lib/recurrence";
import RecurrencePicker from "./RecurrencePicker";
import { TaskBadges } from "./task/TaskBadges";
import { TaskNotesModal } from "./task/TaskNotesModal";
import { ConfirmPopover } from "./task/ConfirmPopover";
import { ProjectPickerList } from "./task/ProjectPickerList";
import { useClickOutside } from "@/hooks/useClickOutside";

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
  /** Set inside a RoadmapStack, whose header already names the roadmap. */
  hideRoadmapBadge?: boolean;
}

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
  hideRoadmapBadge,
}: TaskItemProps) {
  const isFutureScheduled = !task.completed && !!task.hiddenUntil && new Date(task.hiddenUntil) > new Date();
  const [showMenu, setShowMenu] = useState(false);
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
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

  const closeMenu = useCallback(() => setShowMenu(false), []);
  const closeRecurrenceMenu = useCallback(() => setShowRecurrenceMenu(false), []);
  const closeOverflowMenu = useCallback(() => {
    setShowOverflowMenu(false);
    setShowMenu(false);
    setShowRecurrenceMenu(false);
  }, []);
  useClickOutside(menuRef, showMenu, closeMenu);
  useClickOutside(recurrenceMenuRef, showRecurrenceMenu, closeRecurrenceMenu);
  useClickOutside(overflowMenuRef, showOverflowMenu, closeOverflowMenu);

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

  // While not editing, follow the server value (React's "adjust state on prop change" pattern)
  const [syncedNotes, setSyncedNotes] = useState(task.notes);
  if (!editingNotes && syncedNotes !== task.notes) {
    setSyncedNotes(task.notes);
    setNotesValue(task.notes ?? "");
  }

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
          <ConfirmPopover
            key="complete"
            message="Mark as complete?"
            confirmLabel="Yes"
            cancelLabel="No"
            onConfirm={() => { setShowCompleteConfirm(false); onToggle(task.id, true); }}
            onCancel={() => setShowCompleteConfirm(false)}
          />
        )}
        {showDeleteConfirm && (
          <ConfirmPopover
            key="delete"
            message="Delete this task?"
            confirmLabel="Delete"
            cancelLabel="Cancel"
            tone="danger"
            onConfirm={() => { setShowDeleteConfirm(false); onDelete(task.id); }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
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
            <TaskBadges
              task={task}
              isFutureScheduled={isFutureScheduled}
              expanded={expanded}
              hideRoadmap={hideRoadmapBadge}
              onOpenNotes={() => setShowNotesModal(true)}
            />
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
                            <ProjectPickerList
                              variant="accordion"
                              projects={projects}
                              currentProjectId={task.projectId}
                              onPick={(pid) => { onAssign(task.id, pid); setShowMenu(false); setShowOverflowMenu(false); }}
                            />
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
                            <RecurrencePicker
                              task={task}
                              onSave={(type, days, sd, wd) => { onSetRecurrence(task.id, type, days, sd, wd); setShowRecurrenceMenu(false); setShowOverflowMenu(false); }}
                              onRemove={() => { onSetRecurrence(task.id, null); setShowRecurrenceMenu(false); setShowOverflowMenu(false); }}
                            />
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
                  <ProjectPickerList
                    variant="menu"
                    projects={projects}
                    currentProjectId={task.projectId}
                    onPick={(pid) => { onAssign(task.id, pid); setShowMenu(false); }}
                  />
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
                  className="absolute right-0 top-full mt-1 z-40 w-[260px] bg-bg-card border border-border rounded-[4px] shadow-lg overflow-hidden"
                >
                  <RecurrencePicker
                    task={task}
                    onSave={(type, days, sd, wd) => { onSetRecurrence(task.id, type, days, sd, wd); setShowRecurrenceMenu(false); }}
                    onRemove={() => { onSetRecurrence(task.id, null); setShowRecurrenceMenu(false); }}
                  />
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

    <TaskNotesModal
      open={showNotesModal}
      title={task.title}
      value={notesValue}
      wordCount={notesWordCount}
      wordLimit={NOTES_WORD_LIMIT}
      overLimit={notesOverLimit}
      onChange={handleNotesChange}
      onFocus={() => setEditingNotes(true)}
      onClose={() => { handleNotesSave(); setShowNotesModal(false); }}
    />
    </>
  );
}
