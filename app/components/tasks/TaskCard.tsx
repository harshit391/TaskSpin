'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../types';
import { FREQUENCY_OPTIONS, DAY_LABELS } from '../../types';
import { TaskEditModal } from './TaskEditModal';

interface TaskCardProps {
  task: Task;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const frequencyLabel =
    task.frequencyType === 'custom'
      ? `${task.frequencyCount}x / week`
      : task.frequencyType === 'one-time'
      ? 'One-time'
      : FREQUENCY_OPTIONS.find((f) => f.type === task.frequencyType)?.label || task.frequencyType;

  const fixedDaysLabel = task.fixedDays && task.fixedDays.length > 0
    ? task.fixedDays.map(d => DAY_LABELS[d]).join(', ')
    : null;

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => setIsModalOpen(true)}
        className="card group cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-foreground group-hover:text-accent transition-colors truncate">
              {task.name}
            </h3>

            {task.description && (
              <p className="mt-1 text-sm text-(--text-secondary) line-clamp-2">
                {task.description}
              </p>
            )}

            {task.link && (
              <button
                onClick={handleOpenLink}
                className="inline-flex items-center gap-1 mt-2 text-sm text-accent hover:underline"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                {new URL(task.link).hostname}
              </button>
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
                <span className="tag bg-accent/20 text-accent border-accent/30">
                  {fixedDaysLabel}
                </span>
              )}
            </div>
          </div>

          {/* Quick actions on hover */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.link && (
              <button
                onClick={handleOpenLink}
                className="p-2 text-accent hover:bg-accent/10 rounded transition-colors"
                title="Open link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              className="p-2 text-(--text-muted) hover:text-accent hover:bg-(--bg-hover) rounded transition-colors"
              title="View details"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={task}
      />
    </>
  );
}
