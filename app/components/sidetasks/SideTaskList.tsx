'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useSideTaskStore } from '../../store/sideTaskStore';
import type { SideTask } from '../../types';

const sideTaskSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  dueDate: z.string().optional(),
});

type SideTaskFormData = z.infer<typeof sideTaskSchema>;

export function SideTaskList() {
  const sideTasks = useSideTaskStore((state) => state.sideTasks);
  const isLoading = useSideTaskStore((state) => state.isLoading);
  const addSideTask = useSideTaskStore((state) => state.addSideTask);
  const updateSideTask = useSideTaskStore((state) => state.updateSideTask);
  const deleteSideTask = useSideTaskStore((state) => state.deleteSideTask);
  const toggleComplete = useSideTaskStore((state) => state.toggleComplete);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SideTaskFormData>({
    resolver: zodResolver(sideTaskSchema),
    defaultValues: { name: '', description: '', link: '', dueDate: '' },
  });

  const onSubmit = async (data: SideTaskFormData) => {
    await addSideTask(data.name, data.description || undefined, data.link || undefined, data.dueDate || undefined);
    reset();
    setShowForm(false);
  };

  const pending = sideTasks.filter((t) => !t.completed);
  const completed = sideTasks.filter((t) => t.completed);

  const startEdit = (task: SideTask) => {
    setEditingId(task.id);
    setEditName(task.name);
    setEditDescription(task.description || '');
    setEditLink(task.link || '');
    setEditDueDate(task.dueDate || '');
  };

  const saveEdit = async () => {
    if (editingId && editName.trim()) {
      await updateSideTask(editingId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        link: editLink.trim() || undefined,
        dueDate: editDueDate || undefined,
      });
    }
    setEditingId(null);
  };

  const getDueLabel = (dueDate?: string) => {
    if (!dueDate) return null;
    if (dueDate < today) return { text: 'Overdue', cls: 'text-[var(--error)]' };
    if (dueDate === today) return { text: 'Due today', cls: 'text-[var(--warning)]' };
    const due = new Date(dueDate + 'T00:00:00');
    const diff = Math.ceil((due.getTime() - new Date(today + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 3) return { text: `Due in ${diff}d`, cls: 'text-[var(--warning)]' };
    return { text: `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, cls: 'text-[var(--text-muted)]' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-[var(--text-muted)]">Loading side tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-display heading-section text-[var(--text-primary)]">
            Side Tasks
          </h2>
          <p className="mt-1 text-[var(--text-secondary)]">
            {pending.length === 0
              ? 'Low-priority tasks you need to get around to'
              : `${pending.length} pending task${pending.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {!showForm ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setShowForm(true)}
            className="btn-accent w-full flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            ADD SIDE TASK
          </motion.button>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit(onSubmit)}
            className="card space-y-4"
          >
            <div>
              <label className="label">Name</label>
              <input {...register('name')} type="text" placeholder="What needs to be done..." className="input" autoFocus />
              {errors.name && <p className="mt-1 text-sm text-[var(--error)]">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Description (Optional)</label>
              <textarea {...register('description')} placeholder="Details..." rows={2} className="input resize-none" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Link (Optional)</label>
                <input {...register('link')} type="url" placeholder="https://..." className="input" />
                {errors.link && <p className="mt-1 text-sm text-[var(--error)]">{errors.link.message}</p>}
              </div>
              <div className="w-44">
                <label className="label">Due Date (Optional)</label>
                <input {...register('dueDate')} type="date" className="input" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { reset(); setShowForm(false); }} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-accent flex-1">{isSubmitting ? 'Adding...' : 'Add'}</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Pending tasks */}
      <AnimatePresence mode="popLayout">
        {pending.length === 0 && completed.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <h3 className="heading-display heading-sub text-[var(--text-secondary)]">No Side Tasks</h3>
            <p className="mt-2 text-[var(--text-muted)] max-w-sm mx-auto">
              Add tasks that need to get done eventually but don&apos;t need to be scheduled into your week.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {pending.map((task, index) => {
              const due = getDueLabel(task.dueDate);

              if (editingId === task.id) {
                return (
                  <div key={task.id} className="card border-[var(--accent)] space-y-3">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input w-full" autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }} />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description (optional)" className="input w-full resize-none" rows={2} />
                    <div className="flex gap-3">
                      <input type="url" value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder="Link (optional)" className="input flex-1" />
                      <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="input w-44" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
                      <button onClick={saveEdit} className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/80">Save</button>
                    </div>
                  </div>
                );
              }

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-start gap-3 p-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition-colors"
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="mt-0.5 w-5 h-5 rounded-sm border-2 border-[var(--border-color)] hover:border-[var(--accent)] flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{task.name}</p>
                    {task.description && <p className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-2">{task.description}</p>}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {due && <span className={`text-xs font-medium ${due.cls}`}>{due.text}</span>}
                      {task.link && (
                        <a href={task.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
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

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => startEdit(task)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] rounded" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteSideTask(task.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] rounded" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Completed section */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform ${showCompleted ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {completed.length} completed
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2 overflow-hidden"
              >
                {completed.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 p-3 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] opacity-50"
                  >
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className="mt-0.5 w-5 h-5 rounded-sm border-2 border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center flex-shrink-0 cursor-pointer"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-muted)] line-through">{task.name}</p>
                    </div>
                    <button onClick={() => deleteSideTask(task.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
