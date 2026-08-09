"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "@/types/task";

type TaskAction = "delete" | "move_inbox" | "move_project";

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  taskCount: number;
  otherProjects: Project[];
  onConfirm: (action: TaskAction, moveToProjectId?: string) => void;
  onClose: () => void;
}

export function DeleteProjectModal({
  isOpen,
  project,
  taskCount,
  otherProjects,
  onConfirm,
  onClose,
}: DeleteProjectModalProps) {
  const [action, setAction] = useState<TaskAction>("move_inbox");
  const [moveTarget, setMoveTarget] = useState<string>("");

  const handleConfirm = () => {
    onConfirm(action, action === "move_project" ? moveTarget : undefined);
  };

  return (
    <AnimatePresence>
      {isOpen && project && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 top-[20%] z-[60] bg-bg-card border border-border rounded-[4px] sm:w-full sm:max-w-sm overflow-hidden"
          >
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <h3 className="text-sm font-semibold text-text-primary">
                  Delete &ldquo;{project.name}&rdquo;?
                </h3>
              </div>

              {taskCount > 0 ? (
                <>
                  <p className="text-xs text-text-muted mb-4">
                    This project has <span className="text-text-primary font-medium">{taskCount} task{taskCount !== 1 ? "s" : ""}</span>. What should happen to them?
                  </p>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] border border-border hover:border-border-subtle transition-colors cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                      <input
                        type="radio"
                        name="taskAction"
                        value="move_inbox"
                        checked={action === "move_inbox"}
                        onChange={() => setAction("move_inbox")}
                        className="accent-accent w-3.5 h-3.5"
                      />
                      <span className="text-xs text-text-secondary">Move to Inbox</span>
                    </label>

                    <label className="flex items-center gap-3 px-3 py-2.5 rounded-[3px] border border-border hover:border-border-subtle transition-colors cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                      <input
                        type="radio"
                        name="taskAction"
                        value="delete"
                        checked={action === "delete"}
                        onChange={() => setAction("delete")}
                        className="accent-accent w-3.5 h-3.5"
                      />
                      <span className="text-xs text-text-secondary">Delete all tasks</span>
                    </label>

                    {otherProjects.length > 0 && (
                      <label className="flex items-start gap-3 px-3 py-2.5 rounded-[3px] border border-border hover:border-border-subtle transition-colors cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                        <input
                          type="radio"
                          name="taskAction"
                          value="move_project"
                          checked={action === "move_project"}
                          onChange={() => setAction("move_project")}
                          className="accent-accent w-3.5 h-3.5 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-text-secondary">Move to another project</span>
                          <AnimatePresence>
                            {action === "move_project" && (
                              <motion.select
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                value={moveTarget}
                                onChange={(e) => setMoveTarget(e.target.value)}
                                className="w-full mt-2 text-xs bg-bg-primary border border-border rounded-[3px] px-2.5 py-2 text-text-primary focus:outline-none focus:border-accent transition-colors"
                              >
                                <option value="">Select project...</option>
                                {otherProjects.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </motion.select>
                            )}
                          </AnimatePresence>
                        </div>
                      </label>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-text-muted mb-2">
                  This project has no tasks. It will be permanently deleted.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-bg-primary/50">
              <button
                onClick={onClose}
                className="text-xs font-medium text-text-secondary bg-bg-primary border border-border px-4 py-2 rounded-[3px] hover:bg-bg-hover transition-colors min-h-[36px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={action === "move_project" && !moveTarget}
                className="text-xs font-medium text-white bg-error hover:bg-error/80 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-[3px] transition-colors min-h-[36px]"
              >
                Delete Project
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
