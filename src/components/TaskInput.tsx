"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recurrenceLabel } from "@/lib/recurrence";

interface TaskInputProps {
  onAdd: (title: string, recurrence?: { type: string; days?: number; startDate?: string }) => void;
  onAddBatch: (titles: string[], projectName?: string, recurrence?: { type: string; days?: number; startDate?: string }) => void;
  isLoading: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "custom", label: "Custom" },
] as const;

export function TaskInput({ onAdd, onAddBatch, isLoading, inputRef }: TaskInputProps) {
  const [value, setValue] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<string | null>(null);
  const [recurrenceDays, setRecurrenceDays] = useState(7);
  const [recurrenceStartDate, setRecurrenceStartDate] = useState("");
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mergedRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      if (inputRef) (inputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    },
    [inputRef]
  );

  const allLines = value
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const firstLine = allLines[0] ?? "";
  const hasProjectPrefix = firstLine.startsWith("#") && firstLine.length > 1;
  const projectName = hasProjectPrefix ? firstLine.slice(1).trim() : undefined;
  const taskLines = hasProjectPrefix ? allLines.slice(1) : allLines;
  const taskCount = taskLines.length;
  const isMultiple = taskCount > 1 || (hasProjectPrefix && taskCount >= 1);

  const recurrence = recurrenceType
    ? { type: recurrenceType, ...(recurrenceType === "custom" ? { days: recurrenceDays } : {}), ...(recurrenceStartDate ? { startDate: recurrenceStartDate } : {}) }
    : undefined;

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    autoResize();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (taskCount === 0) return;

    if (isMultiple || hasProjectPrefix) {
      onAddBatch(taskLines, projectName, recurrence);
    } else {
      onAdd(taskLines[0], recurrence);
    }
    setValue("");
    setRecurrenceType(null);
    setRecurrenceStartDate("");
    setShowRecurrencePicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (taskCount === 0) return;
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecurrencePicker = () => {
    if (showRecurrencePicker) {
      setShowRecurrencePicker(false);
    } else {
      setShowRecurrencePicker(true);
    }
  };

  const selectRecurrence = (type: string) => {
    if (recurrenceType === type) {
      setRecurrenceType(null);
      setShowRecurrencePicker(false);
    } else {
      setRecurrenceType(type);
      if (type !== "custom") {
        setShowRecurrencePicker(false);
      }
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="space-y-2"
    >
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={mergedRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task..."
            rows={1}
            className="w-full resize-none bg-bg-secondary border border-border rounded-[4px] px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_2px_var(--color-accent-glow)] leading-relaxed"
            aria-label="New task title — press Shift+Enter for multiple tasks"
          />
        </div>
        <button
          type="button"
          onClick={toggleRecurrencePicker}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[4px] border transition-all ${
            recurrenceType
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-bg-secondary text-text-muted hover:text-text-primary hover:border-text-muted"
          }`}
          aria-label="Set recurrence"
          title="Set recurrence"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={taskCount === 0 || isLoading}
          className="bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium uppercase tracking-[0.05em] px-4 sm:px-6 py-2.5 sm:py-3 rounded-[4px] transition-all hover:shadow-[0_0_20px_var(--color-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[44px] min-h-[44px] self-end"
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          ) : isMultiple ? (
            `Add ${taskCount}`
          ) : (
            "Add"
          )}
        </button>
      </div>

      {/* Recurrence picker */}
      <AnimatePresence>
        {showRecurrencePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => selectRecurrence(opt.value)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                    recurrenceType === opt.value
                      ? "bg-accent text-white border-accent"
                      : "border-border text-text-secondary hover:border-accent hover:text-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <AnimatePresence>
                {recurrenceType === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-1 overflow-hidden"
                  >
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={recurrenceDays}
                      onChange={(e) => setRecurrenceDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
                      className="w-12 text-center text-[11px] bg-bg-primary border border-border rounded-[3px] px-1 py-1 text-text-primary focus:outline-none focus:border-accent"
                      aria-label="Number of days"
                    />
                    <span className="text-[11px] text-text-muted">days</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {recurrenceType && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-text-muted">From</span>
                  <input
                    type="date"
                    value={recurrenceStartDate}
                    onChange={(e) => setRecurrenceStartDate(e.target.value)}
                    className="text-[11px] bg-bg-primary border border-border rounded-[3px] px-1.5 py-1 text-text-primary focus:outline-none focus:border-accent [color-scheme:dark]"
                    aria-label="Recurrence start date"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint + badges */}
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between overflow-hidden"
          >
            <span className="text-[11px] text-text-muted">
              <kbd className="px-1 py-0.5 bg-bg-hover rounded text-[10px] text-text-secondary">Shift+Enter</kbd>
              {" "}for new line &middot;{" "}
              <kbd className="px-1 py-0.5 bg-bg-hover rounded text-[10px] text-text-secondary">#Project</kbd>
              {" "}on first line
            </span>
            <div className="flex items-center gap-2">
              {recurrenceType && (
                <motion.button
                  type="button"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => { setRecurrenceType(null); setShowRecurrencePicker(false); }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5 hover:bg-accent/20 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 2l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 014-4h14" />
                    <path d="M7 22l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                  {recurrenceLabel(recurrenceType, recurrenceDays)}
                </motion.button>
              )}
              {hasProjectPrefix && projectName && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M2 4a2 2 0 012-2h4.586a2 2 0 011.414.586l1.828 1.828A2 2 0 0013.414 5H20a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                  </svg>
                  {projectName}
                </motion.span>
              )}
              {taskCount > 0 && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-[11px] font-semibold text-accent"
                >
                  {taskCount} {taskCount === 1 ? "task" : "tasks"}
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
