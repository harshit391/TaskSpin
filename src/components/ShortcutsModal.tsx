"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: "Tasks", items: [{ key: "n", description: "New task" }] },
  {
    category: "Navigation",
    items: [
      { key: "/", description: "Focus search" },
      { key: "s", description: "Open TaskSpin" },
      { key: "m", description: "Toggle sidebar" },
    ],
  },
  {
    category: "Filters",
    items: [
      { key: "1", description: "All tasks" },
      { key: "2", description: "Active tasks" },
      { key: "3", description: "Completed tasks" },
      { key: "f", description: "Toggle filter panel" },
    ],
  },
  { category: "Help", items: [{ key: "?", description: "This panel" }] },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-bg-card border border-border rounded-[4px] sm:w-full sm:max-w-sm max-h-[90vh] overflow-y-auto flex flex-col"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <h2 className="font-[family-name:var(--font-oswald)] text-xl font-semibold uppercase tracking-[0.02em]">
                Keyboard <span className="text-accent">Shortcuts</span>
              </h2>
              <button
                onClick={onClose}
                aria-label="Close shortcuts"
                className="text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {shortcuts.map((group) => (
                <div key={group.category}>
                  <h3 className="text-[11px] uppercase tracking-widest text-text-muted mb-2">
                    {group.category}
                  </h3>
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">{item.description}</span>
                        <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 text-xs font-mono bg-bg-primary border border-border rounded-[3px] text-text-muted">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 pt-0">
              <p className="text-[11px] text-text-muted text-center">
                Shortcuts are disabled while typing in inputs
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
