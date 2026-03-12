'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Pool, PoolSubtask } from '../../types';
import { usePoolStore } from '../../store/poolStore';
import { useSideTaskStore } from '../../store/sideTaskStore';
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
  const [deleteMode, setDeleteMode] = useState<null | 'confirm' | 'choosing'>(null);
  const [editingPool, setEditingPool] = useState(false);
  const [poolName, setPoolName] = useState(pool.name);
  const [poolDescription, setPoolDescription] = useState(pool.description || '');
  const [showSideTaskForm, setShowSideTaskForm] = useState(false);
  const [sideTaskName, setSideTaskName] = useState('');
  const [sideTaskDescription, setSideTaskDescription] = useState('');
  const [sideTaskLink, setSideTaskLink] = useState('');
  const [sideTaskDueDate, setSideTaskDueDate] = useState('');
  const [showCompletedSideTasks, setShowCompletedSideTasks] = useState(false);

  const updatePool = usePoolStore((state) => state.updatePool);
  const deletePool = usePoolStore((state) => state.deletePool);
  const updateSubtask = usePoolStore((state) => state.updateSubtask);
  const deleteSubtask = usePoolStore((state) => state.deleteSubtask);
  const completeActiveSubtask = usePoolStore((state) => state.completeActiveSubtask);
  const reorderSubtasks = usePoolStore((state) => state.reorderSubtasks);

  const allSideTasks = useSideTaskStore((state) => state.sideTasks);
  const poolSideTasks = useMemo(() => allSideTasks.filter((t) => t.poolId === pool.id), [allSideTasks, pool.id]);
  const addSideTask = useSideTaskStore((state) => state.addSideTask);
  const toggleSideTaskComplete = useSideTaskStore((state) => state.toggleComplete);
  const deleteSideTask = useSideTaskStore((state) => state.deleteSideTask);
  const deleteSideTasksByPoolId = useSideTaskStore((state) => state.deleteSideTasksByPoolId);
  const dissociateSideTasksFromPool = useSideTaskStore((state) => state.dissociateSideTasksFromPool);

  // Get fresh pool data from store
  const currentPool = usePoolStore((state) => state.getPoolById(pool.id));
  const displayPool = currentPool || pool;

  const completedCount = displayPool.subtasks.filter((s) => s.status === 'completed').length;
  const totalCount = displayPool.subtasks.length;
  const activeSubtask = displayPool.subtasks.find((s) => s.status === 'active');

  const pendingPoolSideTasks = poolSideTasks.filter((t) => !t.completed);
  const completedPoolSideTasks = poolSideTasks.filter((t) => t.completed);

  const handleAddPoolSideTask = async () => {
    if (!sideTaskName.trim()) return;
    await addSideTask(
      sideTaskName.trim(),
      sideTaskDescription.trim() || undefined,
      sideTaskLink.trim() || undefined,
      sideTaskDueDate || undefined,
      displayPool.id
    );
    setSideTaskName('');
    setSideTaskDescription('');
    setSideTaskLink('');
    setSideTaskDueDate('');
    setShowSideTaskForm(false);
  };

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
        <div className="w-6 h-6 rounded-full bg-(--success) flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    if (status === 'active') {
      return (
        <div className="w-6 h-6 rounded-full border-2 border-accent bg-accent/20 flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full border-2 border-(--border-color) shrink-0" />
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
                  <h2 className="heading-display heading-sub text-foreground truncate">
                    {displayPool.name}
                  </h2>
                  {displayPool.description && (
                    <p className="mt-1 text-sm text-(--text-secondary)">
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
              className="p-2 text-(--text-muted) hover:text-foreground transition-colors"
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
              <div className="h-2 bg-(--bg-secondary) rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${
                    completedCount === totalCount && totalCount > 0
                      ? 'bg-(--success)'
                      : 'bg-accent'
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
              <div className="text-center py-8 text-(--text-muted)">
                <p>No subtasks yet. Add subtasks to build your roadmap.</p>
              </div>
            ) : (
              displayPool.subtasks.map((subtask, index) => {
                if (editingSubtask === subtask.id) {
                  return (
                    <div key={subtask.id} className="card border-accent space-y-3">
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
                        <label className="text-sm text-(--text-secondary)">Duration (days):</label>
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
                        <button onClick={() => setEditingSubtask(null)} className="px-3 py-1.5 text-sm text-(--text-muted) hover:text-foreground">
                          Cancel
                        </button>
                        <button onClick={handleSaveSubtask} className="px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-(--accent)/80">
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
                        ? 'border-accent/40 bg-accent/5'
                        : subtask.status === 'completed'
                        ? 'border-(--success)/20 bg-(--success)/5'
                        : 'border-(--border-color) hover:border-(--text-muted)'
                    }`}
                  >
                    {/* Order number & status */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs text-(--text-muted) w-5 text-right">{index + 1}.</span>
                      {statusIcon(subtask.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        subtask.status === 'completed'
                          ? 'text-(--text-muted) line-through'
                          : subtask.status === 'active'
                          ? 'text-accent'
                          : 'text-foreground'
                      }`}>
                        {subtask.name}
                      </p>
                      {subtask.description && (
                        <p className="mt-0.5 text-sm text-(--text-secondary)">{subtask.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-(--text-muted)">
                          {subtask.estimatedDuration} day{subtask.estimatedDuration > 1 ? 's' : ''}
                        </span>
                        {subtask.link && (
                          <a
                            href={subtask.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
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
                          <span className="text-xs text-(--success)">
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
                            className="p-1 text-(--text-muted) hover:text-foreground"
                            title="Move up"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDown(subtask)}
                            className="p-1 text-(--text-muted) hover:text-foreground"
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
                        className="p-1 text-(--text-muted) hover:text-accent"
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
                          className="p-1 text-(--text-muted) hover:text-(--error)"
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

          {/* Side Tasks Section */}
          <div className="mt-6 pt-4 border-t border-(--border-color)">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-(--text-muted)">
                Side Tasks
                {pendingPoolSideTasks.length > 0 && (
                  <span className="ml-2 tag">{pendingPoolSideTasks.length}</span>
                )}
              </h3>
            </div>

            {/* Pending side tasks list */}
            {pendingPoolSideTasks.map((task) => (
              <div key={task.id} className="group flex items-start gap-3 p-2 rounded border border-(--border-color) bg-(--bg-secondary) hover:border-accent transition-colors mb-2">
                <button
                  onClick={() => toggleSideTaskComplete(task.id)}
                  className="mt-0.5 w-5 h-5 rounded-sm border-2 border-(--border-color) hover:border-accent flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{task.name}</p>
                  {task.description && <p className="mt-0.5 text-xs text-(--text-secondary) line-clamp-2">{task.description}</p>}
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {task.dueDate && <span className="text-xs text-(--text-muted)">Due: {task.dueDate}</span>}
                    {task.link && (
                      <a href={task.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Link
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteSideTask(task.id)}
                  className="p-1.5 text-(--text-muted) hover:text-(--error) rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Completed side tasks (collapsible) */}
            {completedPoolSideTasks.length > 0 && (
              <button
                onClick={() => setShowCompletedSideTasks(!showCompletedSideTasks)}
                className="flex items-center gap-2 text-xs text-(--text-muted) hover:text-(--text-secondary) mb-2"
              >
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`transition-transform ${showCompletedSideTasks ? 'rotate-90' : ''}`}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {completedPoolSideTasks.length} completed
              </button>
            )}
            {showCompletedSideTasks && completedPoolSideTasks.map((task) => (
              <div key={task.id} className="group flex items-start gap-3 p-2 rounded border border-(--border-color) bg-(--bg-secondary) opacity-50 mb-2">
                <button
                  onClick={() => toggleSideTaskComplete(task.id)}
                  className="mt-0.5 w-5 h-5 rounded-sm border-2 border-accent bg-accent flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <p className="text-sm text-(--text-muted) line-through flex-1">{task.name}</p>
              </div>
            ))}

            {/* Add side task form */}
            <AnimatePresence>
              {showSideTaskForm ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="card space-y-3 border-accent/30"
                >
                  <input
                    type="text"
                    value={sideTaskName}
                    onChange={(e) => setSideTaskName(e.target.value)}
                    placeholder="Side task name..."
                    className="input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddPoolSideTask();
                      if (e.key === 'Escape') setShowSideTaskForm(false);
                    }}
                  />
                  <textarea
                    value={sideTaskDescription}
                    onChange={(e) => setSideTaskDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="input resize-none"
                  />
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={sideTaskLink}
                      onChange={(e) => setSideTaskLink(e.target.value)}
                      placeholder="Link (optional)"
                      className="input flex-1"
                    />
                    <input
                      type="date"
                      value={sideTaskDueDate}
                      onChange={(e) => setSideTaskDueDate(e.target.value)}
                      className="input w-40"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSideTaskForm(false)}
                      className="btn-ghost flex-1 text-sm py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPoolSideTask}
                      disabled={!sideTaskName.trim()}
                      className="btn-accent flex-1 text-sm py-2"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowSideTaskForm(true)}
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  Add Side Task
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          </div>

          {/* Footer actions */}
          <div className="mt-4 pt-4 border-t border-(--border-color) flex items-center justify-between">
            {!editingPool && (
              <button
                onClick={() => {
                  setPoolName(displayPool.name);
                  setPoolDescription(displayPool.description || '');
                  setEditingPool(true);
                }}
                className="text-sm text-(--text-muted) hover:text-accent transition-colors"
              >
                Edit Pool
              </button>
            )}
            <div className="flex-1" />
            {deleteMode === null && (
              <button
                onClick={() => {
                  if (poolSideTasks.length > 0) {
                    setDeleteMode('choosing');
                  } else {
                    setDeleteMode('confirm');
                  }
                }}
                className="text-sm text-(--text-muted) hover:text-(--error) transition-colors"
              >
                Delete Pool
              </button>
            )}
            {deleteMode === 'confirm' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-(--error)">Delete this pool?</span>
                <button
                  onClick={handleDeletePool}
                  className="px-3 py-1.5 text-sm bg-(--error) text-white rounded hover:bg-(--error)/80"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteMode(null)}
                  className="px-3 py-1.5 text-sm text-(--text-muted) hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
            {deleteMode === 'choosing' && (
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm text-(--warning)">
                  This pool has {poolSideTasks.length} associated side task{poolSideTasks.length !== 1 ? 's' : ''}. What should happen to them?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await dissociateSideTasksFromPool(displayPool.id);
                      await deletePool(displayPool.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-sm bg-(--bg-hover) border border-(--border-color) text-foreground rounded hover:border-accent"
                  >
                    Keep Side Tasks
                  </button>
                  <button
                    onClick={async () => {
                      await deleteSideTasksByPoolId(displayPool.id);
                      await deletePool(displayPool.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-sm bg-(--error) text-white rounded hover:bg-(--error)/80"
                  >
                    Delete All
                  </button>
                  <button
                    onClick={() => setDeleteMode(null)}
                    className="px-3 py-1.5 text-sm text-(--text-muted) hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
