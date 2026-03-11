'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScheduleStore } from '../../store/scheduleStore';
import { useTaskStore } from '../../store/taskStore';
import { usePoolStore } from '../../store/poolStore';
import { useSideTaskStore } from '../../store/sideTaskStore';
import { DayColumn } from './DayColumn';
import { AllTasksView } from './AllTasksView';
import { ScheduledTaskItem } from './ScheduledTaskItem';
import { formatDateToISO } from '../../services/scheduler';
import type { DayOfWeek } from '../../types';
import { isPoolSubtaskId } from '../../types';

type ViewMode = 'daily' | 'weekly' | 'all';
type TaskFilter = 'all' | 'daily' | 'not-daily' | 'one-time';

export function WeeklySchedule() {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const schedule = useScheduleStore((state) => state.schedule);
  const isLoading = useScheduleStore((state) => state.isLoading);
  const error = useScheduleStore((state) => state.error);
  const generateNewSchedule = useScheduleStore((state) => state.generateNewSchedule);
  const clearError = useScheduleStore((state) => state.clearError);
  const tasks = useTaskStore((state) => state.tasks);
  const pools = usePoolStore((state) => state.pools);
  const pendingSideTaskCount = useSideTaskStore((state) => state.getPendingCount());
  const overdueSideTaskCount = useSideTaskStore((state) => state.getOverdueCount());

  const today = formatDateToISO(new Date());

  const handleRegenerate = async () => {
    clearError();
    await generateNewSchedule();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-[var(--text-muted)]">Generating schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="card border-[var(--error)]/30 bg-[var(--error)]/5 text-center max-w-lg mx-auto">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-4 text-[var(--error)]"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className="heading-display heading-sub text-[var(--error)]">
            Schedule Error
          </h3>
          <p className="mt-2 text-[var(--text-secondary)]">{error}</p>
          <button onClick={handleRegenerate} className="btn-accent mt-6">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasActivePoolSubtasks = pools.some((p) => p.subtasks.some((s) => s.status === 'active'));
  if (tasks.length === 0 && !hasActivePoolSubtasks) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--text-muted)]"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h2 className="heading-display heading-section text-[var(--text-secondary)]">
          No Schedule Yet
        </h2>
        <p className="mt-3 text-[var(--text-muted)] max-w-md mx-auto">
          Add some tasks first, then generate your randomized weekly schedule.
        </p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--accent)]"
          >
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
          </svg>
        </div>
        <h2 className="heading-display heading-section text-[var(--text-primary)]">
          Ready to Spin
        </h2>
        <p className="mt-3 text-[var(--text-secondary)] max-w-md mx-auto">
          Generate a randomized schedule that distributes your {tasks.length} task{tasks.length === 1 ? '' : 's'} across the week.
        </p>
        <button onClick={handleRegenerate} className="btn-accent mt-8">
          Generate Schedule
        </button>
      </div>
    );
  }

  // Calculate stats
  const totalTasks = schedule.days.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedTasks = schedule.days.reduce(
    (sum, d) => sum + d.tasks.filter((t) => t.completed).length,
    0
  );

  // Get today's one-time tasks and pool subtasks for the To-Do section
  const todaySchedule = schedule.days.find(d => d.date === today);
  const oneTimeTasks = todaySchedule?.tasks.filter(st => {
    if (isPoolSubtaskId(st.taskId)) return !st.completed;
    const task = tasks.find(t => t.id === st.taskId);
    return task?.frequencyType === 'one-time' && !st.completed;
  }) || [];
  const todayDay = todaySchedule?.day as DayOfWeek | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="heading-display heading-section text-[var(--text-primary)]">
            {viewMode === 'daily' ? 'Today' : viewMode === 'all' ? 'All Tasks' : 'This Week'}
          </h2>
          <p className="mt-1 text-[var(--text-secondary)]">
            {viewMode === 'all' ? `${tasks.length} unique tasks` : `${completedTasks}/${totalTasks} tasks completed`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Task Filter Dropdown */}
          <select
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value as TaskFilter)}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Tasks</option>
            <option value="daily">Daily Only</option>
            <option value="not-daily">Not Daily</option>
            <option value="one-time">One-time Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All
            </button>
          </div>

          <button onClick={handleRegenerate} className="btn-ghost flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Re-Spin
          </button>
        </div>
      </div>

      {/* One-Time To-Do Section */}
      {oneTimeTasks.length > 0 && todayDay && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent)]/5 to-transparent"
        >
          <div className="flex items-center gap-2 mb-4">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--accent)]"
            >
              <path d="M12 2v4" />
              <path d="m16.2 7.8 2.9-2.9" />
              <path d="M18 12h4" />
              <path d="M12 18v4" />
              <path d="M2 12h4" />
            </svg>
            <h3 className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wider">
              One-Time To-Do
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              ({oneTimeTasks.length} pending)
            </span>
          </div>
          <div className="space-y-2">
            {oneTimeTasks.map((st, index) => (
              <ScheduledTaskItem
                key={`${st.taskId}-onetime`}
                scheduledTask={st}
                day={todayDay}
                index={index}
                expanded={true}
                isToday={true}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Side tasks reminder */}
      {pendingSideTaskCount > 0 && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded border ${
          overdueSideTaskCount > 0
            ? 'border-[var(--error)]/30 bg-[var(--error)]/5'
            : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'
        }`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={overdueSideTaskCount > 0 ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span className="text-sm text-[var(--text-secondary)] flex-1">
            You have <strong className={overdueSideTaskCount > 0 ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}>{pendingSideTaskCount} side task{pendingSideTaskCount !== 1 ? 's' : ''}</strong> pending
            {overdueSideTaskCount > 0 && (
              <span className="text-[var(--error)]"> ({overdueSideTaskCount} overdue)</span>
            )}
          </span>
        </div>
      )}

      {/* Weekly progress bar */}
      <div className="card">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--text-muted)]">Weekly Progress</span>
          <span className="text-[var(--accent)] font-medium">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%' }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              completedTasks === totalTasks && totalTasks > 0
                ? 'bg-[var(--success)]'
                : 'bg-[var(--accent)]'
            }`}
          />
        </div>
      </div>

      {/* Schedule Grid */}
      {viewMode === 'all' ? (
        // All Tasks View - Show all unique tasks
        <AllTasksView taskFilter={taskFilter} />
      ) : viewMode === 'daily' ? (
        // Daily View - Show only today
        <div className="max-w-2xl mx-auto">
          {schedule.days.filter(day => day.date === today).map((day, index) => (
            <DayColumn
              key={day.day}
              scheduledDay={day}
              index={index}
              isToday={true}
              expanded={true}
              taskFilter={taskFilter}
            />
          ))}
          {!schedule.days.some(day => day.date === today) && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              No schedule for today. The current week may have ended.
            </div>
          )}
        </div>
      ) : (
        // Weekly View - Show all days in responsive grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedule.days.map((day, index) => (
            <DayColumn
              key={day.day}
              scheduledDay={day}
              index={index}
              isToday={day.date === today}
              taskFilter={taskFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
