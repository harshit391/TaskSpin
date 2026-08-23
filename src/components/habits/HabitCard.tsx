"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Habit } from "@/types/habit";
import { getLocalDate } from "@/lib/api";
import { HabitHeatmap } from "./HabitHeatmap";
import { HabitProgressRing } from "./HabitProgressRing";
import { HabitCelebration } from "./HabitCelebration";

interface HabitCardProps {
  habit: Habit;
  onCheckin: (id: string) => void;
  onUndo: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const PROGRESSIVE_MILESTONES = [7, 21, 66];

function getNextMilestone(streak: number): number | null {
  for (const m of PROGRESSIVE_MILESTONES) {
    if (streak < m) return m;
  }
  return null;
}

export function HabitCard({ habit, onCheckin, onUndo, onArchive, onDelete }: HabitCardProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const today = getLocalDate();
  const isCheckedToday = habit.checkins.some((c) => c.date === today);

  const handleCheckin = useCallback(() => {
    if (isCheckedToday) return;
    setCelebrating(true);
    onCheckin(habit.id);
  }, [isCheckedToday, onCheckin, habit.id]);

  const handleUndo = useCallback(() => {
    onUndo(habit.id);
  }, [onUndo, habit.id]);

  const nextMilestone = habit.goalMode === "progressive" ? getNextMilestone(habit.currentStreak) : null;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
      className="relative bg-bg-card border border-border rounded-xl p-4 space-y-3"
    >
      {/* Row 1: Name + Streak */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-medium text-text-primary truncate flex-1 mr-2">{habit.name}</h3>
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-400">
              <path d="M12 2c1 3 3.5 5 6 5-1 4-3 8-6 11-3-3-5-7-6-11 2.5 0 5-2 6-5z" fill="currentColor" />
            </svg>
            <span className="text-sm font-semibold text-text-primary">{habit.currentStreak}</span>
          </div>
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-text-muted hover:text-text-primary transition-colors p-1 min-w-[32px] min-h-[32px] inline-flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-bg-secondary border border-border rounded-lg py-1 shadow-lg min-w-[120px]">
                <button
                  onClick={() => { onArchive(habit.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-hover transition-colors"
                >
                  {habit.archived ? "Unarchive" : "Archive"}
                </button>
                <button
                  onClick={() => { onDelete(habit.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-error hover:bg-bg-hover transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Progress */}
      <div className="flex items-center gap-3">
        {habit.goalMode === "single" && habit.goalTarget && (
          <HabitProgressRing current={habit.currentStreak} target={habit.goalTarget} />
        )}
        {habit.goalMode === "progressive" && nextMilestone && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(habit.currentStreak / nextMilestone) * 100}%` }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
              />
            </div>
            <span className="text-[11px] text-text-muted whitespace-nowrap">
              {habit.currentStreak}/{nextMilestone}d
            </span>
          </div>
        )}
        {habit.goalMode === "progressive" && !nextMilestone && (
          <span className="text-[11px] text-accent font-medium">All milestones reached!</span>
        )}
        {habit.goalMode === "infinite" && (
          <span className="text-[11px] text-text-muted">
            Best: {habit.longestStreak}d
          </span>
        )}
      </div>

      {/* Row 3: Heatmap */}
      <HabitHeatmap checkins={habit.checkins} days={30} />

      {/* Row 4: Check-in button */}
      <div className="relative flex items-center justify-center">
        <HabitCelebration isActive={celebrating} onComplete={() => setCelebrating(false)} />
        {isCheckedToday ? (
          <button
            onClick={handleUndo}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium transition-all hover:bg-green-500/15 min-h-[44px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Done today
          </button>
        ) : (
          <motion.button
            onClick={handleCheckin}
            whileTap={{ scale: 0.96 }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-white text-sm font-medium transition-all hover:bg-accent/90 min-h-[44px]"
          >
            Check in
          </motion.button>
        )}
      </div>

      {/* Completed badge */}
      {habit.completedAt && (
        <div className="text-center">
          <span className="text-[11px] text-accent font-medium">Goal reached!</span>
        </div>
      )}
    </motion.div>
  );
}
