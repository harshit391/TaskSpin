import Dexie, { type Table } from 'dexie';
import type { Task, Settings, WeeklySchedule } from '../types';

export class TaskSpinDB extends Dexie {
  tasks!: Table<Task, string>;
  settings!: Table<Settings, string>;
  schedules!: Table<WeeklySchedule, string>;

  constructor() {
    super('TaskSpinDB');

    this.version(1).stores({
      tasks: 'id, name, createdAt',
      settings: 'id',
      schedules: 'id, weekStartDate, generatedAt',
    });
  }
}

export const db = new TaskSpinDB();

// Helper functions for database operations
export async function getAllTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function getTask(id: string): Promise<Task | undefined> {
  return db.tasks.get(id);
}

export async function addTask(task: Task): Promise<string> {
  return db.tasks.add(task);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<number> {
  return db.tasks.update(id, updates);
}

export async function deleteTask(id: string): Promise<void> {
  return db.tasks.delete(id);
}

export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('default');
}

export async function saveSettings(settings: Settings): Promise<string> {
  return db.settings.put(settings);
}

export async function getCurrentSchedule(): Promise<WeeklySchedule | undefined> {
  const schedules = await db.schedules.orderBy('generatedAt').reverse().first();
  return schedules;
}

export async function getScheduleForWeek(weekStartDate: string): Promise<WeeklySchedule | undefined> {
  return db.schedules.where('weekStartDate').equals(weekStartDate).first();
}

export async function saveSchedule(schedule: WeeklySchedule): Promise<string> {
  return db.schedules.put(schedule);
}

export async function deleteOldSchedules(keepCount: number = 4): Promise<void> {
  const allSchedules = await db.schedules.orderBy('generatedAt').reverse().toArray();
  if (allSchedules.length > keepCount) {
    const toDelete = allSchedules.slice(keepCount).map(s => s.id);
    await db.schedules.bulkDelete(toDelete);
  }
}
