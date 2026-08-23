"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoalMode } from "@/types/habit";

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; goalMode: GoalMode; goalTarget?: number }) => void;
}

const GOAL_MODES: { value: GoalMode; label: string; description: string; icon: string }[] = [
  { value: "single", label: "Single Target", description: "Reach a specific day count", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2" },
  { value: "progressive", label: "Progressive", description: "Milestones at 7, 21, 66 days", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8" },
  { value: "infinite", label: "Infinite", description: "Track streaks forever", icon: "M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" },
];

const QUICK_TARGETS = [21, 30, 66];

export function CreateHabitModal({ isOpen, onClose, onCreate }: CreateHabitModalProps) {
  const [name, setName] = useState("");
  const [goalMode, setGoalMode] = useState<GoalMode>("progressive");
  const [goalTarget, setGoalTarget] = useState(21);
  const [customTarget, setCustomTarget] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const target = goalMode === "single" ? (QUICK_TARGETS.includes(goalTarget) ? goalTarget : parseInt(customTarget) || 21) : undefined;
    onCreate({ name: trimmed, goalMode, goalTarget: target });
    setName("");
    setGoalMode("progressive");
    setGoalTarget(21);
    setCustomTarget("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-md bg-bg-secondary border border-border rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold text-text-primary font-display mb-4">New Habit</h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Habit name..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 mb-4"
            />

            <p className="text-xs text-text-muted mb-2 font-medium">Goal Mode</p>
            <div className="space-y-2 mb-4">
              {GOAL_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setGoalMode(mode.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    goalMode === mode.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-border/80 bg-bg-primary"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={goalMode === mode.value ? "text-accent" : "text-text-muted"}>
                    <path d={mode.icon} />
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${goalMode === mode.value ? "text-text-primary" : "text-text-secondary"}`}>{mode.label}</p>
                    <p className="text-[11px] text-text-muted">{mode.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {goalMode === "single" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <p className="text-xs text-text-muted mb-2 font-medium">Target Days</p>
                  <div className="flex items-center gap-2">
                    {QUICK_TARGETS.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setGoalTarget(t); setCustomTarget(""); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          goalTarget === t && !customTarget
                            ? "bg-accent text-white"
                            : "bg-bg-primary border border-border text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                    <input
                      value={customTarget}
                      onChange={(e) => { setCustomTarget(e.target.value); setGoalTarget(0); }}
                      placeholder="Custom"
                      type="number"
                      min={1}
                      className="w-20 bg-bg-primary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              >
                Create
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
