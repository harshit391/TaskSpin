import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SideTask } from '../types';
import { db } from '../database/db';

interface SideTaskStore {
  sideTasks: SideTask[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addSideTask: (name: string, description?: string, link?: string, dueDate?: string, poolId?: string) => Promise<SideTask>;
  updateSideTask: (id: string, updates: Partial<Omit<SideTask, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSideTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  deleteSideTasksByPoolId: (poolId: string) => Promise<void>;
  dissociateSideTasksFromPool: (poolId: string) => Promise<void>;

  // Query helpers
  getPendingCount: () => number;
  getOverdueCount: () => number;
  getSideTasksByPoolId: (poolId: string) => SideTask[];
  getPendingSideTaskCountByPoolId: (poolId: string) => number;
}

export const useSideTaskStore = create<SideTaskStore>((set, get) => ({
  sideTasks: [],
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      const sideTasks = await db.sideTasks.toArray();
      set({ sideTasks, isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize side tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addSideTask: async (name, description, link, dueDate, poolId) => {
    const now = new Date();
    const newTask: SideTask = {
      id: uuidv4(),
      name,
      description: description || undefined,
      link: link || undefined,
      poolId: poolId || undefined,
      dueDate: dueDate || undefined,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.sideTasks.add(newTask);
    set((state) => ({ sideTasks: [...state.sideTasks, newTask] }));
    return newTask;
  },

  updateSideTask: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date() };
    await db.sideTasks.update(id, updatedData);
    set((state) => ({
      sideTasks: state.sideTasks.map((t) =>
        t.id === id ? { ...t, ...updatedData } : t
      ),
    }));
  },

  deleteSideTask: async (id) => {
    await db.sideTasks.delete(id);
    set((state) => ({
      sideTasks: state.sideTasks.filter((t) => t.id !== id),
    }));
  },

  toggleComplete: async (id) => {
    const task = get().sideTasks.find((t) => t.id === id);
    if (!task) return;

    const now = new Date();
    const updates = task.completed
      ? { completed: false, completedAt: undefined, updatedAt: now }
      : { completed: true, completedAt: now, updatedAt: now };

    await db.sideTasks.update(id, updates);
    set((state) => ({
      sideTasks: state.sideTasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  getPendingCount: () => {
    return get().sideTasks.filter((t) => !t.completed).length;
  },

  getOverdueCount: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().sideTasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate < today
    ).length;
  },

  getSideTasksByPoolId: (poolId) => {
    return get().sideTasks.filter((t) => t.poolId === poolId);
  },

  getPendingSideTaskCountByPoolId: (poolId) => {
    return get().sideTasks.filter((t) => t.poolId === poolId && !t.completed).length;
  },

  deleteSideTasksByPoolId: async (poolId) => {
    const toDelete = get().sideTasks.filter((t) => t.poolId === poolId);
    for (const task of toDelete) {
      await db.sideTasks.delete(task.id);
    }
    set((state) => ({
      sideTasks: state.sideTasks.filter((t) => t.poolId !== poolId),
    }));
  },

  dissociateSideTasksFromPool: async (poolId) => {
    const toUpdate = get().sideTasks.filter((t) => t.poolId === poolId);
    for (const task of toUpdate) {
      await db.sideTasks.update(task.id, { poolId: undefined, updatedAt: new Date() });
    }
    set((state) => ({
      sideTasks: state.sideTasks.map((t) =>
        t.poolId === poolId ? { ...t, poolId: undefined, updatedAt: new Date() } : t
      ),
    }));
  },
}));
