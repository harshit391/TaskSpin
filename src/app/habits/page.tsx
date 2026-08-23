"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHabits } from "@/hooks/useHabits";
import { HabitCard } from "@/components/habits/HabitCard";
import { CreateHabitModal } from "@/components/habits/CreateHabitModal";

export default function HabitsPage() {
  const { habits, isLoading, addHabit, checkin, undoCheckin, editHabit, removeHabit } = useHabits();
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);

  return (
    <div className="min-h-dvh bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-4xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-text-muted hover:text-text-primary transition-colors min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              aria-label="Back to tasks"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-lg font-display font-bold text-text-primary">Habits</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="text-accent hover:text-accent/80 transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
            aria-label="Create habit"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="w-[92%] sm:w-[88%] lg:w-[85%] max-w-4xl mx-auto py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
              <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        ) : activeHabits.length === 0 && archivedHabits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
              <path d="M12 2c1 3 3.5 5 6 5-1 4-3 8-6 11-3-3-5-7-6-11 2.5 0 5-2 6-5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-text-muted text-sm">No habits yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active habits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence initial={false}>
                {activeHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onCheckin={checkin}
                    onUndo={undoCheckin}
                    onArchive={(id) => editHabit(id, { archived: true })}
                    onDelete={removeHabit}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Archived section */}
            {archivedHabits.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors mb-3"
                >
                  <motion.svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    animate={{ rotate: showArchived ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </motion.svg>
                  Archived ({archivedHabits.length})
                </button>
                <AnimatePresence>
                  {showArchived && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
                        {archivedHabits.map((habit) => (
                          <HabitCard
                            key={habit.id}
                            habit={habit}
                            onCheckin={checkin}
                            onUndo={undoCheckin}
                            onArchive={(id) => editHabit(id, { archived: false })}
                            onDelete={removeHabit}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateHabitModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={addHabit}
      />
    </div>
  );
}
