import Dexie, { type Table } from 'dexie';
import type { Task, Settings, WeeklySchedule, Pool, SideTask } from '../types';

export class TaskSpinDB extends Dexie {
  tasks!: Table<Task, string>;
  settings!: Table<Settings, string>;
  schedules!: Table<WeeklySchedule, string>;
  pools!: Table<Pool, string>;
  sideTasks!: Table<SideTask, string>;

  constructor() {
    super('TaskSpinDB');

    this.version(1).stores({
      tasks: 'id, name, createdAt',
      settings: 'id',
      schedules: 'id, weekStartDate, generatedAt',
    });

    this.version(2).stores({
      tasks: 'id, name, createdAt',
      settings: 'id',
      schedules: 'id, weekStartDate, generatedAt',
      pools: 'id, name, createdAt',
    });

    this.version(3).stores({
      tasks: 'id, name, createdAt',
      settings: 'id',
      schedules: 'id, weekStartDate, generatedAt',
      pools: 'id, name, createdAt',
      sideTasks: 'id, completed, dueDate, createdAt',
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

// Pool helper functions
export async function getAllPools(): Promise<Pool[]> {
  return db.pools.toArray();
}

export async function getPool(id: string): Promise<Pool | undefined> {
  return db.pools.get(id);
}

export async function addPool(pool: Pool): Promise<string> {
  return db.pools.add(pool);
}

export async function updatePool(id: string, updates: Partial<Pool>): Promise<number> {
  return db.pools.update(id, updates);
}

export async function deletePool(id: string): Promise<void> {
  return db.pools.delete(id);
}
