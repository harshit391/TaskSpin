"use client";

import { AnimatePresence } from "framer-motion";
import { Task, Project } from "@/types/task";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  selectedIds: Set<string>;
  selectionActive: boolean;
  onToggleSelect: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (id: string, title: string) => void;
  onEditNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, projectId: string | null) => void;
  onSetRecurrence: (id: string, recurrenceType: string | null, recurrenceDays?: number, recurrenceStartDate?: string | null) => void;
}

export function TaskList({
  tasks,
  projects,
  selectedIds,
  selectionActive,
  onToggleSelect,
  onToggle,
  onEdit,
  onEditNotes,
  onDelete,
  onAssign,
  onSetRecurrence,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-muted"
          aria-hidden="true"
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" strokeLinecap="round" />
        </svg>
        <p className="text-text-muted text-sm">No tasks here yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 sm:space-y-2" role="list" aria-label="Task list">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            projects={projects}
            isSelected={selectedIds.has(task.id)}
            selectionActive={selectionActive}
            onToggleSelect={onToggleSelect}
            onToggle={onToggle}
            onEdit={onEdit}
            onEditNotes={onEditNotes}
            onDelete={onDelete}
            onAssign={onAssign}
            onSetRecurrence={onSetRecurrence}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
