"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Roadmap } from "@/types/task";

interface DeleteRoadmapModalProps {
  isOpen: boolean;
  roadmap: Roadmap | null;
  taskCount: number;
  onConfirm: (action: "delete" | "move_inbox") => void;
  onClose: () => void;
}

export function DeleteRoadmapModal({ isOpen, roadmap, taskCount, onConfirm, onClose }: DeleteRoadmapModalProps) {
  const [action, setAction] = useState<"delete" | "move_inbox">("move_inbox");

  if (!roadmap) return null;

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-bg-card border border-border rounded-[4px] p-5 space-y-4 shadow-xl">
              <h3 className="text-lg font-semibold text-text-primary">Delete Roadmap</h3>
              <p className="text-sm text-text-secondary">
                Delete <span className="font-medium text-text-primary">&ldquo;{roadmap.title}&rdquo;</span>?
                {taskCount > 0 && ` It has ${taskCount} task${taskCount > 1 ? "s" : ""}.`}
              </p>

              {taskCount > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      checked={action === "move_inbox"}
                      onChange={() => setAction("move_inbox")}
                      className="accent-accent"
                    />
                    Move tasks to Inbox
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      checked={action === "delete"}
                      onChange={() => setAction("delete")}
                      className="accent-accent"
                    />
                    <span className="text-error">Delete all tasks</span>
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-text-secondary border border-border rounded-[4px] hover:bg-bg-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(action)}
                  className="flex-1 px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-white bg-error hover:bg-error/90 rounded-[4px] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
