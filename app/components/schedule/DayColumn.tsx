'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ScheduledDay } from '../../types';
import { DAY_LABELS, isPoolSubtaskId } from '../../types';
import { ScheduledTaskItem } from './ScheduledTaskItem';
import { useSettingsStore } from '../../store/settingsStore';
import { useTaskStore } from '../../store/taskStore';

type TaskFilter = 'all' | 'daily' | 'not-daily' | 'one-time';

interface DayColumnProps {
  scheduledDay: ScheduledDay;
  index: number;
  isToday: boolean;
  expanded?: boolean;
  taskFilter?: TaskFilter;
}

export function DayColumn({ scheduledDay, index, isToday, expanded = false, taskFilter = 'all' }: DayColumnProps) {
  const settings = useSettingsStore((state) => state.settings);
  const getTaskById = useTaskStore((state) => state.getTaskById);
  const capacity = settings.weeklyCapacity[scheduledDay.day];

  // Filter tasks based on taskFilter
  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') {
      return scheduledDay.tasks;
    }
    return scheduledDay.tasks.filter((scheduledTask) => {
      // Pool subtasks: treat like one-time for filtering
      if (isPoolSubtaskId(scheduledTask.taskId)) {
        return taskFilter === 'one-time';
      }
      const task = getTaskById(scheduledTask.taskId);
      if (!task) return false;
      if (taskFilter === 'daily') {
        return task.frequencyType === 'daily';
      }
      if (taskFilter === 'one-time') {
        return task.frequencyType === 'one-time';
      }
      // 'not-daily' excludes both daily and one-time
      return task.frequencyType !== 'daily' && task.frequencyType !== 'one-time';
    });
  }, [scheduledDay.tasks, taskFilter, getTaskById]);

  const completedCount = filteredTasks.filter((t) => t.completed).length;
  const totalCount = filteredTasks.length;

  // Parse date
  const date = new Date(scheduledDay.date + 'T00:00:00');
  const dayNumber = date.getDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex flex-col rounded border transition-all ${
        isToday
          ? 'border-[var(--accent)] bg-[var(--accent)]/5'
          : 'border-[var(--border-color)] bg-[var(--bg-card)]'
      }`}
    >
      {/* Day Header */}
      <div className={`p-4 border-b ${isToday ? 'border-[var(--accent)]/30' : 'border-[var(--border-color)]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`heading-display text-2xl ${
                isToday ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
              }`}
            >
              {dayNumber}
            </span>
            <span
              className={`text-xs font-medium uppercase tracking-wider ${
                isToday ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {DAY_LABELS[scheduledDay.day]}
            </span>
          </div>

          {isToday && <span className="tag tag-accent text-[10px]">TODAY</span>}
        </div>

        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>{completedCount}/{totalCount} done</span>
            <span title="Capacity for non-daily tasks">Cap: {capacity}</span>
          </div>
          <div className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={`h-full rounded-full ${
                completedCount === totalCount && totalCount > 0
                  ? 'bg-[var(--success)]'
                  : 'bg-[var(--accent)]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className={`flex-1 p-3 space-y-2 ${expanded ? 'min-h-[300px]' : 'min-h-[200px] max-h-[400px]'} overflow-y-auto`}>
        {filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            {taskFilter === 'all' ? 'No tasks' :
              taskFilter === 'daily' ? 'No daily tasks' :
              taskFilter === 'one-time' ? 'No one-time tasks' :
              'No non-daily tasks'}
          </div>
        ) : (
          filteredTasks.map((task, taskIndex) => (
            <ScheduledTaskItem
              key={`${task.taskId}-${taskIndex}`}
              scheduledTask={task}
              day={scheduledDay.day}
              index={taskIndex}
              expanded={expanded}
              isToday={isToday}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
