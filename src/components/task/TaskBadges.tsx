"use client";

import { Task } from "@/types/task";
import { recurrenceLabel } from "@/lib/recurrence";

interface TaskBadgesProps {
  task: Task;
  isFutureScheduled: boolean;
  expanded: boolean;
  hideRoadmap?: boolean;
  onOpenNotes: () => void;
}

/** Project, roadmap, recurrence, next-date and notes indicators shown under a task title. */
export function TaskBadges({ task, isFutureScheduled, expanded, hideRoadmap, onOpenNotes }: TaskBadgesProps) {
  const showRoadmap = !!task.roadmap && !hideRoadmap;
  if (!(task.project || showRoadmap || task.recurrenceType || isFutureScheduled || task.notes)) return null;

  return (
    <div className="flex items-center gap-2 mt-0.5">
      {task.project && (
        <span className="inline-flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.project.color }}
          />
          <span className="text-[11px] text-text-muted truncate max-w-[120px]">
            {task.project.name}
          </span>
        </span>
      )}
      {showRoadmap && task.roadmap && (
        <span className="inline-flex items-center gap-1" title="Roadmap">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={task.roadmap.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
          <span className="text-[11px] text-text-muted truncate max-w-[120px]">
            {task.roadmap.title}
          </span>
        </span>
      )}
      {task.recurrenceType && (
        <span className="inline-flex items-center gap-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
          <span className="text-[10px] text-text-muted">
            {recurrenceLabel(task.recurrenceType, task.recurrenceDays, task.recurrenceWeekdays)}
          </span>
        </span>
      )}
      {isFutureScheduled && task.hiddenUntil && (
        <span className="inline-flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent/70">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="text-[10px] text-accent/70 font-medium">
            next: {new Date(task.hiddenUntil).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </span>
      )}
      {task.notes && !expanded && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenNotes(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 hover:text-accent transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </button>
      )}
    </div>
  );
}
