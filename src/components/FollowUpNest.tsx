"use client";

import { motion } from "framer-motion";
import { Task, Project } from "@/types/task";
import { TaskItem } from "./TaskItem";

interface FollowUpNestProps {
  chain: Task[];
  projects: Project[];
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, projectId: string | null) => void;
  onSetRecurrence: (id: string, recurrenceType: string | null, recurrenceDays?: number, recurrenceStartDate?: string | null) => void;
  onOpenFollowUps: (id: string) => void;
}

export function FollowUpNest({
  chain,
  projects,
  selectedIds,
  selectionActive,
  onToggleSelect,
  onToggle,
  onEdit,
  onDelete,
  onAssign,
  onSetRecurrence,
  onOpenFollowUps,
}: FollowUpNestProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", bounce: 0.1, duration: 0.35 }}
      className="overflow-hidden"
    >
      <div className="ml-6 sm:ml-10 pl-3 sm:pl-4 border-l-2 border-accent/20 space-y-1 sm:space-y-1.5 py-1.5">
        {chain.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
          >
            <TaskItem
              task={task}
              projects={projects}
              isSelected={selectedIds.has(task.id)}
              selectionActive={selectionActive}
              hasFollowUps={false}
              isFollowUp={true}
              onToggleSelect={onToggleSelect}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssign={onAssign}
              onSetRecurrence={onSetRecurrence}
              onOpenFollowUps={onOpenFollowUps}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
