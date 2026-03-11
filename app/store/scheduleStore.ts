import { create } from 'zustand';
import type { WeeklySchedule, DayOfWeek } from '../types';
import { isPoolSubtaskId, parsePoolTaskId } from '../types';
import { db } from '../database/db';
import {
  generateWeeklySchedule,
  completeTask as completeTaskUtil,
  removeFutureOccurrence,
  needsNewSchedule,
  formatDateToISO,
  type ScheduleGenerationResult,
  type PoolSubtaskInjection
} from '../services/scheduler';
import { useTaskStore } from './taskStore';
import { useSettingsStore } from './settingsStore';
import { usePoolStore } from './poolStore';

interface ScheduleStore {
  schedule: WeeklySchedule | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  generateNewSchedule: () => Promise<ScheduleGenerationResult>;
  completeTask: (taskId: string, day: DayOfWeek, removeNextOccurrence: boolean) => Promise<void>;
  uncompleteTask: (taskId: string, day: DayOfWeek) => Promise<void>;
  swapTaskWithToday: (taskId: string, fromDay: DayOfWeek, swapWithTaskId: string) => Promise<void>;
  getTodaySwappableTasks: () => { taskId: string; name: string }[];
  checkAndRegenerate: () => Promise<void>;
  clearError: () => void;
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedule: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      // Get the most recent schedule
      const schedules = await db.schedules.orderBy('generatedAt').reverse().first();

      if (schedules) {
        // Check if we need a new schedule (week changed)
        const { settings } = useSettingsStore.getState();

        if (needsNewSchedule(schedules, settings.weekConfig)) {
          // Generate new schedule for current week
          const result = await get().generateNewSchedule();
          if (!result.success) {
            set({ error: result.error || 'Failed to generate schedule' });
          }
        } else {
          set({ schedule: schedules });
        }
      }

      set({ isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize schedule:', error);
      set({ error: 'Failed to load schedule' });
    } finally {
      set({ isLoading: false });
    }
  },

  generateNewSchedule: async () => {
    set({ isLoading: true, error: null });

    try {
      const { tasks } = useTaskStore.getState();
      const { settings } = useSettingsStore.getState();
      const { getActiveSubtasks } = usePoolStore.getState();

      // Build pool subtask injections
      const activePoolSubtasks = getActiveSubtasks();
      const poolSubtasks: PoolSubtaskInjection[] = activePoolSubtasks.map(({ pool, subtask }) => ({
        poolId: pool.id,
        subtaskId: subtask.id,
        name: subtask.name,
        description: subtask.description,
        link: subtask.link,
      }));

      const result = generateWeeklySchedule(
        tasks,
        settings.weeklyCapacity,
        settings.weekConfig,
        new Date(),
        poolSubtasks
      );

      if (result.success && result.schedule) {
        await db.schedules.put(result.schedule);

        // Clean up old schedules (keep last 4 weeks)
        const allSchedules = await db.schedules.orderBy('generatedAt').reverse().toArray();
        if (allSchedules.length > 4) {
          const toDelete = allSchedules.slice(4).map(s => s.id);
          await db.schedules.bulkDelete(toDelete);
        }

        set({ schedule: result.schedule });
      } else {
        set({ error: result.error || 'Failed to generate schedule' });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate schedule';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  completeTask: async (taskId, day, removeNextOccurrence) => {
    const { schedule } = get();
    if (!schedule) return;

    try {
      let updatedSchedule = completeTaskUtil(schedule, taskId, day);

      // Check if this is a pool subtask
      if (isPoolSubtaskId(taskId)) {
        const { poolId } = parsePoolTaskId(taskId);
        const { completeActiveSubtask } = usePoolStore.getState();
        await completeActiveSubtask(poolId);

        // Remove this subtask from all days (like one-time behavior)
        updatedSchedule = {
          ...updatedSchedule,
          days: updatedSchedule.days.map(daySchedule => ({
            ...daySchedule,
            tasks: daySchedule.tasks.filter(t => t.taskId !== taskId),
          })),
        };
      } else if (removeNextOccurrence) {
        updatedSchedule = removeFutureOccurrence(updatedSchedule, taskId, day);
      }

      // Check if this is a one-time task - if so, delete it after completion
      if (!isPoolSubtaskId(taskId)) {
        const { getTaskById, deleteTask } = useTaskStore.getState();
        const task = getTaskById(taskId);

        if (task?.frequencyType === 'one-time') {
          // Remove this task from all days in the schedule
          updatedSchedule = {
            ...updatedSchedule,
            days: updatedSchedule.days.map(daySchedule => ({
              ...daySchedule,
              tasks: daySchedule.tasks.filter(t => t.taskId !== taskId),
            })),
          };
          // Delete the task permanently
          await deleteTask(taskId);
        }
      }

      await db.schedules.put(updatedSchedule);
      set({ schedule: updatedSchedule });
    } catch (error) {
      console.error('Failed to complete task:', error);
      set({ error: 'Failed to update task completion' });
    }
  },

  uncompleteTask: async (taskId, day) => {
    const { schedule } = get();
    if (!schedule) return;

    try {
      const updatedDays = schedule.days.map(daySchedule => {
        if (daySchedule.day === day) {
          const updatedTasks = daySchedule.tasks.map(task => {
            if (task.taskId === taskId && task.completed) {
              // Remove completion status
              const { completed: _completed, completedAt: _completedAt, ...rest } = task;
              return { ...rest, completed: false };
            }
            return task;
          });
          return { ...daySchedule, tasks: updatedTasks };
        }
        return daySchedule;
      });

      const updatedSchedule = { ...schedule, days: updatedDays };
      await db.schedules.put(updatedSchedule);
      set({ schedule: updatedSchedule });
    } catch (error) {
      console.error('Failed to uncomplete task:', error);
      set({ error: 'Failed to update task completion' });
    }
  },

  swapTaskWithToday: async (taskId, fromDay, swapWithTaskId) => {
    const { schedule } = get();
    if (!schedule) return;

    try {
      const today = formatDateToISO(new Date());
      const todaySchedule = schedule.days.find(d => d.date === today);
      const fromDaySchedule = schedule.days.find(d => d.day === fromDay);

      if (!todaySchedule || !fromDaySchedule) return;

      // Find the specific task from today to swap
      const todayTaskToSwap = todaySchedule.tasks.find(t => t.taskId === swapWithTaskId);
      // Find the task being completed from the other day
      const completedTask = fromDaySchedule.tasks.find(t => t.taskId === taskId);

      if (!todayTaskToSwap || !completedTask) return;

      const updatedDays = schedule.days.map(daySchedule => {
        // Handle today's schedule
        if (daySchedule.date === today) {
          // Remove the task being swapped to fromDay
          let updatedTasks = daySchedule.tasks.filter(t => t.taskId !== swapWithTaskId);
          // Add the completed task to today (marked as complete)
          updatedTasks.push({ taskId, completed: true, completedAt: new Date() });
          return { ...daySchedule, tasks: updatedTasks };
        }

        // Handle fromDay's schedule
        if (daySchedule.day === fromDay) {
          // Remove the completed task from this day
          let updatedTasks = daySchedule.tasks.filter(t => t.taskId !== taskId);
          // Add today's swapped task to this day (not completed)
          updatedTasks.push({ ...todayTaskToSwap, completed: false });
          return { ...daySchedule, tasks: updatedTasks };
        }

        return daySchedule;
      });

      const updatedSchedule = { ...schedule, days: updatedDays };
      await db.schedules.put(updatedSchedule);
      set({ schedule: updatedSchedule });
    } catch (error) {
      console.error('Failed to swap task:', error);
      set({ error: 'Failed to swap task' });
    }
  },

  getTodaySwappableTasks: () => {
    const { schedule } = get();
    if (!schedule) return [];

    const today = formatDateToISO(new Date());
    const todaySchedule = schedule.days.find(d => d.date === today);

    if (!todaySchedule) return [];

    const { getTaskById } = useTaskStore.getState();

    return todaySchedule.tasks
      .filter(t => {
        if (t.completed) return false;
        const task = getTaskById(t.taskId);
        return task && task.frequencyType !== 'daily';
      })
      .map(t => {
        const task = getTaskById(t.taskId);
        return { taskId: t.taskId, name: task?.name || 'Unknown' };
      });
  },

  checkAndRegenerate: async () => {
    const { schedule } = get();
    const { settings } = useSettingsStore.getState();

    if (needsNewSchedule(schedule, settings.weekConfig)) {
      await get().generateNewSchedule();
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
