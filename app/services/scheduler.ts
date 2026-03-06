import type { Task, WeeklyCapacity, WeekConfig, DayOfWeek, ScheduledTask, WeeklySchedule } from '../types';
import { DAYS_OF_WEEK } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get ordered days starting from the configured start day
export function getOrderedDays(weekConfig: WeekConfig): DayOfWeek[] {
  const startIndex = DAYS_OF_WEEK.indexOf(weekConfig.startDay);
  const orderedDays: DayOfWeek[] = [];
  for (let i = 0; i < 7; i++) {
    orderedDays.push(DAYS_OF_WEEK[(startIndex + i) % 7]);
  }
  return orderedDays;
}

// Calculate the start date of the current week based on config
export function getWeekStartDate(weekConfig: WeekConfig, referenceDate: Date = new Date()): Date {
  const days = getOrderedDays(weekConfig);
  const startDay = days[0];

  const dayIndexMap: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDayIndex = dayIndexMap[startDay];
  const currentDayIndex = referenceDate.getDay();

  // Calculate days to subtract to get to start of week
  let daysToSubtract = currentDayIndex - targetDayIndex;
  if (daysToSubtract < 0) {
    daysToSubtract += 7;
  }

  const startDate = new Date(referenceDate);
  startDate.setDate(referenceDate.getDate() - daysToSubtract);
  startDate.setHours(0, 0, 0, 0);

  return startDate;
}

// Format date to ISO string (YYYY-MM-DD) using local timezone
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate dates for each day of the week
function generateWeekDates(startDate: Date, orderedDays: DayOfWeek[]): Map<DayOfWeek, string> {
  const dateMap = new Map<DayOfWeek, string>();

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dateMap.set(orderedDays[i], formatDateToISO(date));
  }

  return dateMap;
}

export interface ScheduleGenerationResult {
  success: boolean;
  schedule?: WeeklySchedule;
  error?: string;
}

export function generateWeeklySchedule(
  tasks: Task[],
  capacity: WeeklyCapacity,
  weekConfig: WeekConfig,
  referenceDate: Date = new Date()
): ScheduleGenerationResult {
  if (tasks.length === 0) {
    const startDate = getWeekStartDate(weekConfig, referenceDate);
    const orderedDays = getOrderedDays(weekConfig);
    const dateMap = generateWeekDates(startDate, orderedDays);

    const emptySchedule: WeeklySchedule = {
      id: uuidv4(),
      weekStartDate: formatDateToISO(startDate),
      weekEndDate: formatDateToISO(new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)),
      days: orderedDays.map(day => ({
        day,
        date: dateMap.get(day)!,
        tasks: [],
      })),
      generatedAt: new Date(),
    };

    return { success: true, schedule: emptySchedule };
  }

  const orderedDays = getOrderedDays(weekConfig);
  const startDate = getWeekStartDate(weekConfig, referenceDate);
  const dateMap = generateWeekDates(startDate, orderedDays);

  // Initialize the schedule structure
  const daySchedule = new Map<DayOfWeek, ScheduledTask[]>();
  orderedDays.forEach(day => daySchedule.set(day, []));

  // Track remaining capacity for each day
  const remainingCapacity = new Map<DayOfWeek, number>();
  orderedDays.forEach(day => remainingCapacity.set(day, capacity[day]));

  // Separate tasks into categories
  const dailyTasks = tasks.filter(t => t.frequencyType === 'daily');
  const oneTimeTasks = tasks.filter(t => t.frequencyType === 'one-time');
  const fixedDayTasks = tasks.filter(t =>
    t.frequencyType !== 'daily' &&
    t.frequencyType !== 'one-time' &&
    t.fixedDays &&
    t.fixedDays.length > 0
  );
  const randomTasks = tasks.filter(t =>
    t.frequencyType !== 'daily' &&
    t.frequencyType !== 'one-time' &&
    (!t.fixedDays || t.fixedDays.length === 0)
  );

  // Step 1: Place daily tasks on all days (daily tasks don't count against capacity)
  for (const task of dailyTasks) {
    for (const day of orderedDays) {
      daySchedule.get(day)!.push({
        taskId: task.id,
        completed: false,
      });
    }
  }

  // Step 2: Place one-time tasks on all days (like daily, don't count against capacity)
  for (const task of oneTimeTasks) {
    for (const day of orderedDays) {
      daySchedule.get(day)!.push({
        taskId: task.id,
        completed: false,
      });
    }
  }

  // Step 3: Place fixed-day tasks on their specific days
  for (const task of fixedDayTasks) {
    for (const fixedDay of task.fixedDays!) {
      if (!orderedDays.includes(fixedDay)) continue;

      if (remainingCapacity.get(fixedDay)! <= 0) {
        return {
          success: false,
          error: `Cannot place "${task.name}" on ${fixedDay} - insufficient capacity.`,
        };
      }

      daySchedule.get(fixedDay)!.push({
        taskId: task.id,
        completed: false,
      });
      remainingCapacity.set(fixedDay, remainingCapacity.get(fixedDay)! - 1);
    }
  }

  // Step 4: Create a pool of (task, occurrences) for random tasks
  interface TaskOccurrence {
    taskId: string;
    remaining: number;
  }

  const taskPool: TaskOccurrence[] = randomTasks.map(task => ({
    taskId: task.id,
    remaining: task.frequencyCount,
  }));

  // Calculate total needed slots vs available slots
  const totalNeededSlots = taskPool.reduce((sum, t) => sum + t.remaining, 0);
  const totalAvailableSlots = orderedDays.reduce((sum, day) => sum + remainingCapacity.get(day)!, 0);

  if (totalNeededSlots > totalAvailableSlots) {
    return {
      success: false,
      error: `Not enough capacity to schedule all non-daily tasks. Need ${totalNeededSlots} slots but only ${totalAvailableSlots} available. Please increase daily capacity or reduce task frequencies.`,
    };
  }

  // Step 5: Randomly distribute remaining tasks
  // Shuffle task pool for randomness
  const shuffledPool = shuffleArray(taskPool);

  for (const taskOcc of shuffledPool) {
    // Get eligible days (has capacity, task not already assigned to this day)
    const assignedDays = new Set<DayOfWeek>();

    // Try to distribute task across different days
    let attemptsRemaining = taskOcc.remaining;

    while (attemptsRemaining > 0) {
      // Get eligible days for this task
      const eligibleDays = orderedDays.filter(day =>
        remainingCapacity.get(day)! > 0 &&
        !assignedDays.has(day)
      );

      if (eligibleDays.length === 0) {
        // If no eligible days, try to double up on days (if task frequency is high)
        const daysWithCapacity = orderedDays.filter(day => remainingCapacity.get(day)! > 0);

        if (daysWithCapacity.length === 0) {
          return {
            success: false,
            error: `Unable to schedule task completely. Not enough available days with capacity.`,
          };
        }

        // Pick a random day with capacity
        const randomDay = daysWithCapacity[Math.floor(Math.random() * daysWithCapacity.length)];
        daySchedule.get(randomDay)!.push({
          taskId: taskOcc.taskId,
          completed: false,
        });
        remainingCapacity.set(randomDay, remainingCapacity.get(randomDay)! - 1);
        attemptsRemaining--;
        continue;
      }

      // Shuffle eligible days and pick one
      const shuffledEligible = shuffleArray(eligibleDays);
      const selectedDay = shuffledEligible[0];

      daySchedule.get(selectedDay)!.push({
        taskId: taskOcc.taskId,
        completed: false,
      });
      assignedDays.add(selectedDay);
      remainingCapacity.set(selectedDay, remainingCapacity.get(selectedDay)! - 1);
      attemptsRemaining--;
    }
  }

  // Step 6: Build final schedule
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const schedule: WeeklySchedule = {
    id: uuidv4(),
    weekStartDate: formatDateToISO(startDate),
    weekEndDate: formatDateToISO(endDate),
    days: orderedDays.map(day => ({
      day,
      date: dateMap.get(day)!,
      tasks: shuffleArray(daySchedule.get(day)!), // Shuffle tasks within each day too
    })),
    generatedAt: new Date(),
  };

  return { success: true, schedule };
}

// Mark a task as completed - only marks the specific day's occurrence
export function completeTask(
  schedule: WeeklySchedule,
  taskId: string,
  completionDay: DayOfWeek
): WeeklySchedule {
  const updatedDays = schedule.days.map(daySchedule => {
    if (daySchedule.day !== completionDay) {
      return daySchedule;
    }

    const updatedTasks = daySchedule.tasks.map(task => {
      if (task.taskId === taskId) {
        return {
          ...task,
          completed: true,
          completedAt: new Date(),
        };
      }
      return task;
    });

    return {
      ...daySchedule,
      tasks: updatedTasks,
    };
  });

  return {
    ...schedule,
    days: updatedDays,
  };
}

// Remove future occurrences of a task after early completion
export function removeFutureOccurrence(
  schedule: WeeklySchedule,
  taskId: string,
  afterDay: DayOfWeek
): WeeklySchedule {
  const afterDayIndex = schedule.days.findIndex(d => d.day === afterDay);

  const updatedDays = schedule.days.map((daySchedule, index) => {
    if (index > afterDayIndex) {
      // Find and remove the first uncompleted occurrence of this task
      const futureTaskIndex = daySchedule.tasks.findIndex(
        t => t.taskId === taskId && !t.completed
      );

      if (futureTaskIndex !== -1) {
        const updatedTasks = [...daySchedule.tasks];
        updatedTasks.splice(futureTaskIndex, 1);
        return {
          ...daySchedule,
          tasks: updatedTasks,
        };
      }
    }
    return daySchedule;
  });

  return {
    ...schedule,
    days: updatedDays,
  };
}

// Check if we need a new schedule (week has changed)
export function needsNewSchedule(
  currentSchedule: WeeklySchedule | null,
  weekConfig: WeekConfig,
  referenceDate: Date = new Date()
): boolean {
  if (!currentSchedule) return true;

  const currentWeekStart = formatDateToISO(getWeekStartDate(weekConfig, referenceDate));
  return currentSchedule.weekStartDate !== currentWeekStart;
}
