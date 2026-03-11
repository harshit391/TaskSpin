'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Pool, PoolSubtask } from '../../types';
import { usePoolStore } from '../../store/poolStore';
import { SubtaskForm } from './SubtaskForm';

interface PoolDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: Pool;
}

export function PoolDetailModal({ isOpen, onClose, pool }: PoolDetailModalProps) {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editDuration, setEditDuration] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingPool, setEditingPool] = useState(false);
  const [poolName, setPoolName] = useState(pool.name);
  const [poolDescription, setPoolDescription] = useState(pool.description || '');

  const updatePool = usePoolStore((state) => state.updatePool);
  const deletePool = usePoolStore((state) => state.deletePool);
  const updateSubtask = usePoolStore((state) => state.updateSubtask);
  const deleteSubtask = usePoolStore((state) => state.deleteSubtask);
  const completeActiveSubtask = usePoolStore((state) => state.completeActiveSubtask);
  const reorderSubtasks = usePoolStore((state) => state.reorderSubtasks);

  // Get fresh pool data from store
  const currentPool = usePoolStore((state) => state.getPoolById(pool.id));
  const displayPool = currentPool || pool;

  const completedCount = displayPool.subtasks.filter((s) => s.status === 'completed').length;
  const totalCount = displayPool.subtasks.length;
  const activeSubtask = displayPool.subtasks.find((s) => s.status === 'active');

  const handleCompleteActive = async () => {
    await completeActiveSubtask(displayPool.id);
  };

  const handleMoveUp = async (subtask: PoolSubtask) => {
    const idx = displayPool.subtasks.findIndex((s) => s.id === subtask.id);
    if (idx <= 0) return;
    // Find the previous subtask that can be swapped (only pending can be reordered)
    const prevIdx = idx - 1;
    const prev = displayPool.subtasks[prevIdx];
    if (prev.status !== 'pending' && subtask.status !== 'pending') return;

    const ids = displayPool.subtasks.map((s) => s.id);
    [ids[prevIdx], ids[idx]] = [ids[idx], ids[prevIdx]];
    await reorderSubtasks(displayPool.id, ids);
  };

  const handleMoveDown = async (subtask: PoolSubtask) => {
    const idx = displayPool.subtasks.findIndex((s) => s.id === subtask.id);
    if (idx >= displayPool.subtasks.length - 1) return;
    const nextIdx = idx + 1;
    const next = displayPool.subtasks[nextIdx];
    if (next.status !== 'pending' && subtask.status !== 'pending') return;

    const ids = displayPool.subtasks.map((s) => s.id);
    [ids[idx], ids[nextIdx]] = [ids[nextIdx], ids[idx]];
    await reorderSubtasks(displayPool.id, ids);
  };

  const handleStartEditSubtask = (subtask: PoolSubtask) => {
    setEditingSubtask(subtask.id);
    setEditName(subtask.name);
    setEditDescription(subtask.description || '');
    setEditLink(subtask.link || '');
    setEditDuration(subtask.estimatedDuration);
  };

  const handleSaveSubtask = async () => {
    if (editingSubtask && editName.trim()) {
      await updateSubtask(displayPool.id, editingSubtask, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        link: editLink.trim() || undefined,
        estimatedDuration: editDuration,
      });
    }
    setEditingSubtask(null);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await deleteSubtask(displayPool.id, subtaskId);
  };

  const handleSavePool = async () => {
    if (poolName.trim()) {
      await updatePool(displayPool.id, {
        name: poolName.trim(),
        description: poolDescription.trim() || undefined,
      });
    }
    setEditingPool(false);
  };

  const handleDeletePool = async () => {
    await deletePool(displayPool.id);
    onClose();
  };

  if (!isOpen) return null;

  const statusIcon = (status: PoolSubtask['status']) => {
    if (status === 'completed') {
      return (
        <div className="w-6 h-6 rounded-full bg-[var(--success)] flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    if (status === 'active') {
      return (
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full border-2 border-[var(--border-color)] flex-shrink-0" />
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          className="card max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              {editingPool ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                    className="input w-full text-lg font-medium"
                    autoFocus
                  />
                  <textarea
                    value={poolDescription}
                    onChange={(e) => setPoolDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="input w-full resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSavePool} className="btn-accent text-sm px-3 py-1.5">
                      Save
                    </button>
                    <button onClick={() => setEditingPool(false)} className="btn-ghost text-sm px-3 py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="heading-display heading-sub text-[var(--text-primary)] truncate">
                    {displayPool.name}
                  </h2>
                  {displayPool.description && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {displayPool.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="tag">
                      {completedCount}/{totalCount} complete
                    </span>
                    {activeSubtask && (
                      <span className="tag tag-accent">
                        Active: {activeSubtask.name}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mb-4">
              <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${
                    completedCount === totalCount && totalCount > 0
                      ? 'bg-[var(--success)]'
                      : 'bg-[var(--accent)]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Complete active button */}
          {activeSubtask && (
            <button
              onClick={handleCompleteActive}
              className="btn-accent w-full mb-4 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Complete &quot;{activeSubtask.name}&quot;
            </button>
          )}

          {/* Subtask roadmap */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {displayPool.subtasks.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <p>No subtasks yet. Add subtasks to build your roadmap.</p>
              </div>
            ) : (
              displayPool.subtasks.map((subtask, index) => {
                if (editingSubtask === subtask.id) {
                  return (
                    <div key={subtask.id} className="card border-[var(--accent)] space-y-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input w-full"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveSubtask();
                          if (e.key === 'Escape') setEditingSubtask(null);
                        }}
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="input w-full resize-none"
                        rows={2}
                      />
                      <input
                        type="url"
                        value={editLink}
                        onChange={(e) => setEditLink(e.target.value)}
                        placeholder="Link (optional)"
                        className="input w-full"
                      />
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-[var(--text-secondary)]">Duration (days):</label>
                        <input
                          type="number"
                          value={editDuration}
                          onChange={(e) => setEditDuration(Math.max(1, parseInt(e.target.value) || 1))}
                          min={1}
                          max={365}
                          className="input w-20"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingSubtask(null)} className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                          Cancel
                        </button>
                        <button onClick={handleSaveSubtask} className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/80">
                          Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={subtask.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-start gap-3 px-4 py-3 rounded-lg border transition-colors group ${
                      subtask.status === 'active'
                        ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5'
                        : subtask.status === 'completed'
                        ? 'border-[var(--success)]/20 bg-[var(--success)]/5'
                        : 'border-[var(--border-color)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {/* Order number & status */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs text-[var(--text-muted)] w-5 text-right">{index + 1}.</span>
                      {statusIcon(subtask.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        subtask.status === 'completed'
                          ? 'text-[var(--text-muted)] line-through'
                          : subtask.status === 'active'
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text-primary)]'
                      }`}>
                        {subtask.name}
                      </p>
                      {subtask.description && (
                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{subtask.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[var(--text-muted)]">
                          {subtask.estimatedDuration} day{subtask.estimatedDuration > 1 ? 's' : ''}
                        </span>
                        {subtask.link && (
                          <a
                            href={subtask.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            Link
                          </a>
                        )}
                        {subtask.status === 'completed' && subtask.completedAt && (
                          <span className="text-xs text-[var(--success)]">
                            Completed {new Date(subtask.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {subtask.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleMoveUp(subtask)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title="Move up"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDown(subtask)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title="Move down"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleStartEditSubtask(subtask)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"
                        title="Edit subtask"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {subtask.status !== 'completed' && (
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                          title="Delete subtask"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Add subtask */}
          <div className="mt-4">
            <AnimatePresence>
              {showSubtaskForm ? (
                <SubtaskForm
                  poolId={displayPool.id}
                  onSuccess={() => setShowSubtaskForm(false)}
                  onCancel={() => setShowSubtaskForm(false)}
                />
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSubtaskForm(true)}
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Add Subtask
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
            {!editingPool && (
              <button
                onClick={() => {
                  setPoolName(displayPool.name);
                  setPoolDescription(displayPool.description || '');
                  setEditingPool(true);
                }}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                Edit Pool
              </button>
            )}
            <div className="flex-1" />
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--error)]">Delete this pool?</span>
                <button
                  onClick={handleDeletePool}
                  className="px-3 py-1.5 text-sm bg-[var(--error)] text-white rounded hover:bg-[var(--error)]/80"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
              >
                Delete Pool
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
