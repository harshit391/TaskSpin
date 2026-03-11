'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ScheduledTask, DayOfWeek, Task } from '../../types';
import { isPoolSubtaskId, parsePoolTaskId } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { usePoolStore } from '../../store/poolStore';
import { FREQUENCY_OPTIONS } from '../../types';
import { TaskDetailModal } from './TaskDetailModal';

interface ScheduledTaskItemProps {
  scheduledTask: ScheduledTask;
  day: DayOfWeek;
  index: number;
  expanded?: boolean;
  isToday?: boolean;
}

export function ScheduledTaskItem({ scheduledTask, day, index, expanded = false, isToday = false }: ScheduledTaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTaskById = useTaskStore((state) => state.getTaskById);
  const getPoolById = usePoolStore((state) => state.getPoolById);
  const completeTask = useScheduleStore((state) => state.completeTask);
  const uncompleteTask = useScheduleStore((state) => state.uncompleteTask);

  const isPoolTask = isPoolSubtaskId(scheduledTask.taskId);

  // Resolve task data: either from task store or synthesized from pool store
  let task: Task | undefined;
  let poolLabel: string | undefined;
  if (isPoolTask) {
    const { poolId, subtaskId } = parsePoolTaskId(scheduledTask.taskId);
    const pool = getPoolById(poolId);
    const subtask = pool?.subtasks.find((s) => s.id === subtaskId);
    if (pool && subtask) {
      poolLabel = pool.name;
      task = {
        id: scheduledTask.taskId,
        name: subtask.name,
        description: subtask.description,
        link: subtask.link,
        frequencyType: 'one-time',
        frequencyCount: 7,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
      } as Task;
    }
  } else {
    task = getTaskById(scheduledTask.taskId);
  }

  if (!task) return null;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Only allow completing/uncompleting if it's today
    if (!isToday) return;

    // Don't allow uncompleting one-time or pool tasks
    if (scheduledTask.completed && (task!.frequencyType === 'one-time' || isPoolTask)) return;

    if (scheduledTask.completed) {
      await uncompleteTask(scheduledTask.taskId, day);
    } else {
      if (isPoolTask) {
        await completeTask(scheduledTask.taskId, day, false);
      } else {
        const removeNextOccurrence = task!.frequencyType !== 'daily' && task!.frequencyType !== 'one-time';
        await completeTask(scheduledTask.taskId, day, removeNextOccurrence);
      }
    }
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task!.link) {
      window.open(task!.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenModal = () => {
    if (!isPoolTask) {
      setIsModalOpen(true);
    }
  };

  const frequencyLabel = isPoolTask
    ? 'Pool'
    : task.frequencyType === 'custom'
      ? `${task.frequencyCount}x/week`
      : task.frequencyType === 'one-time'
      ? 'One-time'
      : FREQUENCY_OPTIONS.find((f) => f.type === task.frequencyType)?.label || task.frequencyType;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={handleOpenModal}
        className={`group flex items-start gap-3 p-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all cursor-pointer ${
          scheduledTask.completed
            ? 'opacity-50'
            : 'hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        {/* Checkbox - only clickable if today */}
        <div
          onClick={isToday ? handleToggleComplete : undefined}
          className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            scheduledTask.completed
              ? 'border-[var(--accent)] bg-[var(--accent)]'
              : isToday
              ? 'border-[var(--border-color)] hover:border-[var(--accent)] cursor-pointer'
              : 'border-[var(--border-color)] opacity-40 cursor-not-allowed'
          }`}
          title={isToday ? (scheduledTask.completed ? 'Mark incomplete' : 'Mark complete') : 'Can only complete today\'s tasks'}
        >
          {scheduledTask.completed && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium transition-all ${
              scheduledTask.completed
                ? 'text-[var(--text-muted)] line-through'
                : 'text-[var(--text-primary)]'
            } ${expanded ? '' : 'truncate'}`}
          >
            {task.name}
          </p>
          {expanded && task.description && (
            <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
              {task.description}
            </p>
          )}
          {expanded && task.link && (
            <button
              onClick={handleOpenLink}
              className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--accent)] hover:underline"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {new URL(task.link).hostname}
            </button>
          )}
          {expanded && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)]">
                {frequencyLabel}
              </span>
              {isPoolTask && poolLabel && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                  {poolLabel}
                </span>
              )}
              {!isPoolTask && task.frequencyType === 'one-time' && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                  ONE-TIME
                </span>
              )}
              {task.fixedDays && task.fixedDays.length > 0 && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                  FIXED
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions - visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {task.link && (
            <button
              onClick={handleOpenLink}
              className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded transition-colors"
              title="Open link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            title="View details"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>

        {/* Badge indicators (compact view) */}
        {!expanded && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {task.link && (
              <button
                onClick={handleOpenLink}
                className="p-1 text-[var(--accent)]"
                title="Has link"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            )}
            {isPoolTask && (
              <span className="tag text-[10px] tag-accent">POOL</span>
            )}
            {!isPoolTask && task.frequencyType === 'one-time' && (
              <span className="tag text-[10px] tag-accent">ONE-TIME</span>
            )}
            {!isPoolTask && task.frequencyType === 'daily' && (
              <span className="tag text-[10px]">DAILY</span>
            )}
            {task.fixedDays && task.fixedDays.length > 0 && (
              <span className="tag text-[10px] bg-[var(--accent)]/20 text-[var(--accent)]">FIXED</span>
            )}
          </div>
        )}
      </motion.div>

      {/* Task Detail Modal - only for regular tasks */}
      {!isPoolTask && (
        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={task}
          scheduledTask={scheduledTask}
          day={day}
          isToday={isToday}
        />
      )}
    </>
  );
}
