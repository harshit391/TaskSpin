"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recurrenceDescription } from "@/lib/recurrence";

interface FollowUpModalProps {
  isOpen: boolean;
  completedTaskTitle: string;
  recurrenceInfo?: { type: string; days?: number | null } | null;
  onAdd: (title: string) => void;
  onSkip: () => void;
}

export function FollowUpModal({ isOpen, completedTaskTitle, recurrenceInfo, onAdd, onSkip }: FollowUpModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
    } else {
      onSkip();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onSkip();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onSkip}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/3 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-bg-card border border-border rounded-[4px] sm:w-full sm:max-w-sm p-5 space-y-4"
          >
            <div className="space-y-1">
              <p className="text-xs text-text-muted uppercase tracking-[0.08em] font-medium">
                Task completed
              </p>
              <p className="text-sm text-text-secondary line-clamp-2">
                {completedTaskTitle}
              </p>
              {recurrenceInfo && (
                <p className="text-[11px] text-accent flex items-center gap-1 pt-0.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 2l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 014-4h14" />
                    <path d="M7 22l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                  This task will return {recurrenceDescription(recurrenceInfo.type, recurrenceInfo.days)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Add a follow-up?
              </label>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Follow-up task..."
                className="w-full text-sm bg-bg-primary border border-border rounded-[3px] px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="flex-1 border border-border text-text-secondary hover:text-text-primary text-xs font-medium uppercase tracking-[0.05em] px-4 py-2.5 rounded-[4px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium uppercase tracking-[0.05em] px-4 py-2.5 rounded-[4px] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Add
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
