"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TaskNotesModalProps {
  open: boolean;
  title: string;
  value: string;
  wordCount: number;
  wordLimit: number;
  overLimit: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus: () => void;
  /** Saves and closes. */
  onClose: () => void;
}

/** Full-screen (mobile) / centered (desktop) editor for a task's notes. */
export function TaskNotesModal({ open, title, value, wordCount, wordLimit, overLimit, onChange, onFocus, onClose }: TaskNotesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
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
              <h3 className="text-sm font-semibold text-text-primary truncate flex-1 mr-3">{title}</h3>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
                aria-label="Close notes"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              placeholder="Add notes..."
              className="flex-1 min-h-[200px] w-full resize-none bg-bg-primary border border-border rounded-lg p-3 text-sm sm:text-base text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <p className={`text-[11px] ${overLimit ? "text-error" : "text-text-muted"}`}>
                {wordCount}/{wordLimit} words
              </p>
              <button
                onClick={onClose}
                className="text-xs font-medium text-accent hover:text-accent/80 transition-colors min-h-[36px] px-3"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
