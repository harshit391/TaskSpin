"use client";

import { motion } from "framer-motion";

interface ConfirmPopoverProps {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "accent" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small yes/no prompt centered over a task row. Render inside an AnimatePresence. */
export function ConfirmPopover({ message, confirmLabel, cancelLabel, tone = "accent", onConfirm, onCancel }: ConfirmPopoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-bg-card border border-border rounded-[4px] shadow-lg px-4 py-3 flex flex-col items-center gap-2.5 min-w-[200px]"
    >
      <p className="text-xs text-text-secondary text-center">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className={`${tone === "danger" ? "bg-error hover:bg-error/80" : "bg-accent hover:bg-accent-hover"} text-white text-xs font-medium px-3.5 py-1.5 rounded-[3px] transition-colors min-h-[36px]`}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="bg-bg-primary border border-border text-text-secondary text-xs font-medium px-3.5 py-1.5 rounded-[3px] hover:bg-bg-hover transition-colors min-h-[36px]"
        >
          {cancelLabel}
        </button>
      </div>
    </motion.div>
  );
}
