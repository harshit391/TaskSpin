'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { FREQUENCY_OPTIONS, DAY_LABELS, type DayOfWeek } from '../../types';
import { formatDateToISO } from '../../services/scheduler';

type TaskFilter = 'all' | 'daily' | 'not-daily';

interface AllTasksViewProps {
  taskFilter: TaskFilter;
}

export function AllTasksView({ taskFilter }: AllTasksViewProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const schedule = useScheduleStore((state) => state.schedule);
  const completeTask = useScheduleStore((state) => state.completeTask);
  const uncompleteTask = useScheduleStore((state) => state.uncompleteTask);
  const swapTaskWithToday = useScheduleStore((state) => state.swapTaskWithToday);
  const getTodaySwappableTasks = useScheduleStore((state) => state.getTodaySwappableTasks);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');
  const [swapConfirm, setSwapConfirm] = useState<{ taskId: string; day: DayOfWeek } | null>(null);
  const [selectedSwapTask, setSelectedSwapTask] = useState<string | null>(null);

  const today = formatDateToISO(new Date());

  // Filter tasks based on taskFilter
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    if (taskFilter === 'daily') return tasks.filter(t => t.frequencyType === 'daily');
    return tasks.filter(t => t.frequencyType !== 'daily');
  }, [tasks, taskFilter]);

  // Get today's swappable tasks when swap dialog is shown
  const todaySwappableTasks = useMemo(() => {
    if (!swapConfirm) return [];
    return getTodaySwappableTasks();
  }, [swapConfirm, getTodaySwappableTasks]);

  // Get completion stats and occurrences for each task this week
  const getTaskStats = (taskId: string) => {
    if (!schedule) return { scheduled: 0, completed: 0, scheduledDays: [] as string[], occurrences: [] as { day: DayOfWeek; date: string; completed: boolean }[] };

    let scheduled = 0;
    let completed = 0;
    const scheduledDays: string[] = [];
    const occurrences: { day: DayOfWeek; date: string; completed: boolean }[] = [];

    schedule.days.forEach(day => {
      day.tasks.forEach(t => {
        if (t.taskId === taskId) {
          scheduled++;
          scheduledDays.push(DAY_LABELS[day.day]);
          occurrences.push({ day: day.day, date: day.date, completed: t.completed });
          if (t.completed) completed++;
        }
      });
    });

    return { scheduled, completed, scheduledDays, occurrences };
  };

  const handleToggleOccurrence = async (taskId: string, day: DayOfWeek, date: string, currentlyCompleted: boolean, isDaily: boolean) => {
    if (currentlyCompleted) {
      // Uncomplete
      await uncompleteTask(taskId, day);
    } else {
      // Check if this is not today and not a daily task
      const isToday = date === today;
      if (!isToday && !isDaily) {
        // Show swap confirmation
        setSwapConfirm({ taskId, day });
        setSelectedSwapTask(null);
      } else {
        // Complete normally
        await completeTask(taskId, day, !isDaily);
      }
    }
  };

  const handleConfirmSwap = async () => {
    if (swapConfirm && selectedSwapTask) {
      await swapTaskWithToday(swapConfirm.taskId, swapConfirm.day, selectedSwapTask);
      setSwapConfirm(null);
      setSelectedSwapTask(null);
    }
  };

  const handleCompleteWithoutSwap = async () => {
    if (swapConfirm) {
      const task = tasks.find(t => t.id === swapConfirm.taskId);
      const isDaily = task?.frequencyType === 'daily';
      await completeTask(swapConfirm.taskId, swapConfirm.day, !isDaily);
      setSwapConfirm(null);
      setSelectedSwapTask(null);
    }
  };

  const handleStartEdit = (task: typeof tasks[0]) => {
    setEditingId(task.id);
    setEditName(task.name);
    setEditDescription(task.description || '');
    setEditLink(task.link || '');
  };

  const handleSaveEdit = async () => {
    if (editingId && editName.trim()) {
      await updateTask(editingId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        link: editLink.trim() || undefined,
      });
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleOpenLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        No {taskFilter === 'daily' ? 'daily' : taskFilter === 'not-daily' ? 'non-daily' : ''} tasks found.
      </div>
    );
  }

  // Swap confirmation modal with task selection
  if (swapConfirm) {
    const task = tasks.find(t => t.id === swapConfirm.taskId);
    const hasSwappableTasks = todaySwappableTasks.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto card border-[var(--warning)] bg-[var(--warning)]/5 space-y-4"
      >
        <h3 className="text-lg font-medium text-[var(--text-primary)]">
          Complete Task from {DAY_LABELS[swapConfirm.day]}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          You&apos;re completing <strong className="text-[var(--text-primary)]">{task?.name}</strong> which was scheduled for {DAY_LABELS[swapConfirm.day]}.
        </p>

        {hasSwappableTasks ? (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Select a task from today to swap:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {todaySwappableTasks.map((swapTask) => (
                  <button
                    key={swapTask.taskId}
                    onClick={() => setSelectedSwapTask(swapTask.taskId)}
                    className={`w-full text-left px-4 py-3 rounded border transition-all ${
                      selectedSwapTask === swapTask.taskId
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedSwapTask === swapTask.taskId
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border-color)]'
                      }`}>
                        {selectedSwapTask === swapTask.taskId && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">{swapTask.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleConfirmSwap}
                disabled={!selectedSwapTask}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  selectedSwapTask
                    ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                Swap & Complete
              </button>
              <button
                onClick={handleCompleteWithoutSwap}
                className="px-4 py-2 text-sm bg-[var(--bg-hover)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Just Complete (No Swap)
              </button>
              <button
                onClick={() => {
                  setSwapConfirm(null);
                  setSelectedSwapTask(null);
                }}
                className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--text-muted)] italic">
              No swappable tasks available for today (all tasks are either completed or daily).
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleCompleteWithoutSwap}
                className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/80 transition-colors"
              >
                Complete Without Swap
              </button>
              <button
                onClick={() => {
                  setSwapConfirm(null);
                  setSelectedSwapTask(null);
                }}
                className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task, index) => {
        const stats = getTaskStats(task.id);
        const frequencyLabel =
          task.frequencyType === 'custom'
            ? `${task.frequencyCount}x/week`
            : FREQUENCY_OPTIONS.find((f) => f.type === task.frequencyType)?.label || task.frequencyType;

        const isEditing = editingId === task.id;
        const isDaily = task.frequencyType === 'daily';

        if (isEditing) {
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border-[var(--accent)] space-y-3"
            >
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Task name"
                className="input w-full"
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
                className="input w-full resize-none"
                rows={2}
              />
              <input
                type="url"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                placeholder="Link (optional) - https://..."
                className="input w-full"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/80 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="card group hover:border-[var(--accent)] transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">
                    {task.name}
                  </h3>
                  <span className={`tag ${task.frequencyType === 'daily' ? 'tag-accent' : ''}`}>
                    {frequencyLabel}
                  </span>
                </div>

                {task.description && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
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

                {/* Weekly occurrences with checkboxes */}
                {stats.occurrences.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-[var(--text-muted)] mb-2">This week&apos;s occurrences:</p>
                    <div className="flex flex-wrap gap-2">
                      {stats.occurrences.map((occ, i) => {
                        const isToday = occ.date === today;
                        return (
                          <button
                            key={i}
                            onClick={() => handleToggleOccurrence(task.id, occ.day, occ.date, occ.completed, isDaily)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-all ${
                              occ.completed
                                ? 'border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]'
                                : isToday
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20'
                                : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                              occ.completed
                                ? 'border-[var(--success)] bg-[var(--success)]'
                                : 'border-current'
                            }`}>
                              {occ.completed && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                            <span>{DAY_LABELS[occ.day]}</span>
                            {isToday && <span className="text-[10px] font-medium">(Today)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {stats.scheduled > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--text-muted)]">Progress</span>
                      <span className={`font-medium ${stats.completed === stats.scheduled ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                        {stats.completed}/{stats.scheduled}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden max-w-xs">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.completed / stats.scheduled) * 100}%` }}
                        className={`h-full rounded-full ${
                          stats.completed === stats.scheduled ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {task.link && (
                  <button
                    onClick={() => handleOpenLink(task.link!)}
                    className="p-2 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded transition-colors"
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
                  onClick={() => handleStartEdit(task)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] rounded transition-colors"
                  title="Edit task"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
