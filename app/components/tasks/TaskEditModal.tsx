'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../types';
import { FREQUENCY_OPTIONS, DAY_LABELS } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { useSideTaskStore } from '../../store/sideTaskStore';
import { usePoolStore } from '../../store/poolStore';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export function TaskEditModal({ isOpen, onClose, task }: TaskEditModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editLink, setEditLink] = useState(task.link || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveToSide, setShowMoveToSide] = useState(false);
  const [moveDueDate, setMoveDueDate] = useState('');
  const [movePoolId, setMovePoolId] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const addSideTask = useSideTaskStore((state) => state.addSideTask);
  const pools = usePoolStore((state) => state.pools);

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setEditName(task.name);
      setEditDescription(task.description || '');
      setEditLink(task.link || '');
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setShowMoveToSide(false);
      setMoveDueDate('');
      setMovePoolId('');
    }
  }, [isOpen, task]);

  const frequencyLabel =
    task.frequencyType === 'custom'
      ? `${task.frequencyCount}x / week`
      : task.frequencyType === 'one-time'
      ? 'One-time'
      : FREQUENCY_OPTIONS.find((f) => f.type === task.frequencyType)?.label || task.frequencyType;

  const fixedDaysLabel = task.fixedDays && task.fixedDays.length > 0
    ? task.fixedDays.map(d => DAY_LABELS[d]).join(', ')
    : null;

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
    setEditName(task.name);
    setEditDescription(task.description || '');
    setEditLink(task.link || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    onClose();
  };

  const handleOpenLink = () => {
    if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleMoveToSideTask = async () => {
    setIsMoving(true);
    try {
      await addSideTask(
        task.name,
        task.description || undefined,
        task.link || undefined,
        moveDueDate || undefined,
        movePoolId || undefined
      );
      await deleteTask(task.id);
      onClose();
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg bg-(--bg-card) border border-(--border-color) rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-(--border-color)">
                <div className="flex-1 min-w-0 pr-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input text-xl font-semibold w-full"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                  ) : (
                    <h2 className="text-xl font-semibold text-foreground wrap-break-word">
                      {task.name}
                    </h2>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`tag ${task.frequencyType === 'daily' || task.frequencyType === 'one-time' ? 'tag-accent' : ''}`}>
                      {frequencyLabel}
                    </span>
                    {fixedDaysLabel && (
                      <span className="tag bg-accent/20 text-accent">
                        {fixedDaysLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 text-(--text-muted) hover:text-foreground hover:bg-(--bg-hover) rounded transition-colors shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Description */}
                <div>
                  <label className="label">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={3}
                      className="input resize-none w-full"
                    />
                  ) : (
                    <p className={`text-sm ${task.description ? 'text-(--text-secondary)' : 'text-(--text-muted) italic'}`}>
                      {task.description || 'No description'}
                    </p>
                  )}
                </div>

                {/* Link */}
                <div>
                  <label className="label">Link</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      placeholder="https://example.com"
                      className="input w-full"
                    />
                  ) : task.link ? (
                    <div className="flex items-center gap-3">
                      <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline truncate flex-1"
                      >
                        {task.link}
                      </a>
                      <button
                        onClick={handleOpenLink}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white rounded hover:bg-(--accent-hover) transition-colors shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Open Link
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-(--text-muted) italic">No link attached</p>
                  )}
                </div>

                {/* Task Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Created</label>
                    <p className="text-sm text-(--text-secondary)">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="label">Last Updated</label>
                    <p className="text-sm text-(--text-secondary)">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-(--border-color) bg-(--bg-secondary)">
                {isEditing ? (
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={handleCancelEdit}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="btn-accent"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : showDeleteConfirm ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-(--text-secondary)">Delete this task?</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-6 py-3 rounded font-medium bg-(--error) text-white hover:bg-(--error)/80 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : showMoveToSide ? (
                  <div className="space-y-4">
                    <p className="text-sm text-(--text-secondary)">Move to side tasks with optional details:</p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="label">Due Date (Optional)</label>
                        <input
                          type="date"
                          value={moveDueDate}
                          onChange={(e) => setMoveDueDate(e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      {pools.length > 0 && (
                        <div className="flex-1">
                          <label className="label">Pool (Optional)</label>
                          <select
                            value={movePoolId}
                            onChange={(e) => setMovePoolId(e.target.value)}
                            className="input w-full"
                          >
                            <option value="">No pool</option>
                            {pools.map((pool) => (
                              <option key={pool.id} value={pool.id}>{pool.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowMoveToSide(false)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleMoveToSideTask}
                        disabled={isMoving}
                        className="btn-accent flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h6v6" />
                          <path d="M10 14L21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                        {isMoving ? 'Moving...' : 'Move'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-(--error) hover:bg-(--error)/10 rounded transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                      <button
                        onClick={() => setShowMoveToSide(true)}
                        className="flex items-center gap-2 px-4 py-2 text-(--text-secondary) hover:text-accent hover:bg-accent/10 rounded transition-colors"
                        title="Move to Side Tasks"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h6v6" />
                          <path d="M10 14L21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                        Side Task
                      </button>
                    </div>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-accent flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
