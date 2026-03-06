'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ScheduledTask, DayOfWeek } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { FREQUENCY_OPTIONS } from '../../types';

interface ScheduledTaskItemProps {
  scheduledTask: ScheduledTask;
  day: DayOfWeek;
  index: number;
  expanded?: boolean;
  isToday?: boolean;
}

export function ScheduledTaskItem({ scheduledTask, day, index, expanded = false, isToday = false }: ScheduledTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');

  const getTaskById = useTaskStore((state) => state.getTaskById);
  const updateTask = useTaskStore((state) => state.updateTask);
  const completeTask = useScheduleStore((state) => state.completeTask);
  const uncompleteTask = useScheduleStore((state) => state.uncompleteTask);

  const task = getTaskById(scheduledTask.taskId);

  if (!task) return null;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Only allow completing/uncompleting if it's today
    if (!isToday) return;

    if (scheduledTask.completed) {
      // Uncomplete the task
      await uncompleteTask(scheduledTask.taskId, day);
    } else {
      // Complete the task on its scheduled day
      const removeNextOccurrence = task.frequencyType !== 'daily';
      await completeTask(scheduledTask.taskId, day, removeNextOccurrence);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(task.name);
    setEditDescription(task.description || '');
    setEditLink(task.link || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editName.trim()) {
      await updateTask(task.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        link: editLink.trim() || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(task.name);
    setEditDescription(task.description || '');
    setEditLink(task.link || '');
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const frequencyLabel =
    task.frequencyType === 'custom'
      ? `${task.frequencyCount}x/week`
      : FREQUENCY_OPTIONS.find((f) => f.type === task.frequencyType)?.label || task.frequencyType;

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 rounded border border-[var(--accent)] bg-[var(--bg-secondary)] space-y-3"
      >
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Task name"
          className="input w-full text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') handleCancelEdit();
          }}
        />
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description (optional)"
          className="input w-full text-sm resize-none"
          rows={2}
        />
        <input
          type="url"
          value={editLink}
          onChange={(e) => setEditLink(e.target.value)}
          placeholder="Link (optional) - https://..."
          className="input w-full text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancelEdit}
            className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-3 py-1.5 text-xs bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/80 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group flex items-start gap-3 p-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] transition-all ${
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
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {task.description}
          </p>
        )}
        {expanded && task.link && (
          <a
            href={task.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--accent)] hover:underline"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {new URL(task.link).hostname}
          </a>
        )}
        {expanded && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)]">
              {frequencyLabel}
            </span>
            {task.frequencyType === 'one-time' && (
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

      {/* Actions */}
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
          onClick={handleStartEdit}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] rounded transition-colors"
          title="Edit task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* Badge indicators */}
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
          {task.frequencyType === 'one-time' && (
            <span className="tag text-[10px] tag-accent">ONE-TIME</span>
          )}
          {task.frequencyType === 'daily' && (
            <span className="tag text-[10px]">DAILY</span>
          )}
          {task.fixedDays && task.fixedDays.length > 0 && (
            <span className="tag text-[10px] bg-[var(--accent)]/20 text-[var(--accent)]">FIXED</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
