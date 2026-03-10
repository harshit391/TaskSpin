import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Task, FrequencyType, DayOfWeek } from '../types';
import { db } from '../database/db';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addTask: (name: string, description: string, frequencyType: FrequencyType, frequencyCount: number, link?: string, fixedDays?: DayOfWeek[]) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      const tasks = await db.tasks.toArray();
      set({ tasks, isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (name, description, frequencyType, frequencyCount, link, fixedDays) => {
    const now = new Date();
    const newTask: Task = {
      id: uuidv4(),
      name,
      description: description || undefined,
      link: link || undefined,
      frequencyType,
      frequencyCount,
      fixedDays: fixedDays && fixedDays.length > 0 ? fixedDays : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await db.tasks.add(newTask);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  updateTask: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date() };
    await db.tasks.update(id, updatedData);
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updatedData } : task
      ),
    }));
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  getTaskById: (id) => {
    return get().tasks.find((task) => task.id === id);
  },
}));
