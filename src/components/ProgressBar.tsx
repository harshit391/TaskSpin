"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isComplete = total > 0 && completed === total;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
          Progress
        </span>
        <span className="text-xs text-text-secondary">
          {completed} of {total} completed
        </span>
      </div>
      <div
        className="h-2 bg-bg-secondary rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percentage}% tasks completed`}
      >
        <motion.div
          className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-accent"}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
