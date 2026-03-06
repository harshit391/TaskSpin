'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../types';
import { FREQUENCY_OPTIONS, DAY_LABELS } from '../../types';
import { useTaskStore } from '../../store/taskStore';

interface TaskCardProps {
  task: Task;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const frequencyLabel =
    task.frequencyType === 'custom'
      ? `${task.frequencyCount}x / week`
      : task.frequencyType === 'one-time'
      ? 'One-time'
      : FREQUENCY_OPTIONS.find((f) => f.type === task.frequencyType)?.label || task.frequencyType;

  const fixedDaysLabel = task.fixedDays && task.fixedDays.length > 0
    ? task.fixedDays.map(d => DAY_LABELS[d]).join(', ')
    : null;

  const handleSave = async () => {
    if (editName.trim() && editName !== task.name) {
      await updateTask(task.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="card group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditName(task.name);
                  setIsEditing(false);
                }
              }}
              className="input text-lg font-medium"
              autoFocus
            />
          ) : (
            <h3
              onClick={() => setIsEditing(true)}
              className="text-lg font-medium text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent)] transition-colors truncate"
            >
              {task.name}
            </h3>
          )}

          {task.description && (
            <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
              {task.description}
            </p>
          )}

          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-[var(--accent)] hover:underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {new URL(task.link).hostname}
            </a>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`tag ${
                task.frequencyType === 'daily' || task.frequencyType === 'one-time' ? 'tag-accent' : ''
              }`}
            >
              {frequencyLabel}
            </span>
            {fixedDaysLabel && (
              <span className="tag bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30">
                {fixedDaysLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDeleteConfirm ? (
            <>
              <button
                onClick={handleDelete}
                className="p-2 text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors"
                title="Confirm delete"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                title="Cancel"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors"
              title="Delete task"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
