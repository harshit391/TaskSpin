import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Pool, PoolSubtask } from '../types';
import { db } from '../database/db';

interface PoolStore {
  pools: Pool[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addPool: (name: string, description?: string) => Promise<Pool>;
  updatePool: (id: string, updates: Partial<Omit<Pool, 'id' | 'createdAt' | 'subtasks'>>) => Promise<void>;
  deletePool: (id: string) => Promise<void>;
  getPoolById: (id: string) => Pool | undefined;

  // Subtask actions
  addSubtask: (poolId: string, name: string, description?: string, link?: string, estimatedDuration?: number) => Promise<void>;
  updateSubtask: (poolId: string, subtaskId: string, updates: Partial<Omit<PoolSubtask, 'id' | 'order'>>) => Promise<void>;
  deleteSubtask: (poolId: string, subtaskId: string) => Promise<void>;
  reorderSubtasks: (poolId: string, subtaskIds: string[]) => Promise<void>;
  completeActiveSubtask: (poolId: string) => Promise<void>;

  // Import
  importPools: (pools: Pool[]) => Promise<void>;

  // Query helpers
  getActiveSubtasks: () => { pool: Pool; subtask: PoolSubtask }[];
}

export const usePoolStore = create<PoolStore>((set, get) => ({
  pools: [],
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      const pools = await db.pools.toArray();
      set({ pools, isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize pools:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addPool: async (name, description) => {
    const now = new Date();
    const newPool: Pool = {
      id: uuidv4(),
      name,
      description: description || undefined,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.pools.add(newPool);
    set((state) => ({ pools: [...state.pools, newPool] }));
    return newPool;
  },

  updatePool: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date() };
    await db.pools.update(id, updatedData);
    set((state) => ({
      pools: state.pools.map((pool) =>
        pool.id === id ? { ...pool, ...updatedData } : pool
      ),
    }));
  },

  deletePool: async (id) => {
    await db.pools.delete(id);
    set((state) => ({
      pools: state.pools.filter((pool) => pool.id !== id),
    }));
  },

  getPoolById: (id) => {
    return get().pools.find((pool) => pool.id === id);
  },

  addSubtask: async (poolId, name, description, link, estimatedDuration = 7) => {
    const pool = get().getPoolById(poolId);
    if (!pool) return;

    const isFirst = pool.subtasks.length === 0;
    const newSubtask: PoolSubtask = {
      id: uuidv4(),
      name,
      description: description || undefined,
      link: link || undefined,
      estimatedDuration,
      order: pool.subtasks.length,
      status: isFirst ? 'active' : 'pending',
      activatedAt: isFirst ? new Date() : undefined,
    };

    const updatedPool: Pool = {
      ...pool,
      subtasks: [...pool.subtasks, newSubtask],
      updatedAt: new Date(),
    };

    await db.pools.put(updatedPool);
    set((state) => ({
      pools: state.pools.map((p) => (p.id === poolId ? updatedPool : p)),
    }));
  },

  updateSubtask: async (poolId, subtaskId, updates) => {
    const pool = get().getPoolById(poolId);
    if (!pool) return;

    const updatedPool: Pool = {
      ...pool,
      subtasks: pool.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, ...updates } : st
      ),
      updatedAt: new Date(),
    };

    await db.pools.put(updatedPool);
    set((state) => ({
      pools: state.pools.map((p) => (p.id === poolId ? updatedPool : p)),
    }));
  },

  deleteSubtask: async (poolId, subtaskId) => {
    const pool = get().getPoolById(poolId);
    if (!pool) return;

    const wasActive = pool.subtasks.find((st) => st.id === subtaskId)?.status === 'active';
    const filtered = pool.subtasks
      .filter((st) => st.id !== subtaskId)
      .map((st, index) => ({ ...st, order: index }));

    // If we deleted the active subtask, activate the next pending one
    let subtasks = filtered;
    if (wasActive) {
      const nextPending = subtasks.find((st) => st.status === 'pending');
      if (nextPending) {
        subtasks = subtasks.map((st) =>
          st.id === nextPending.id
            ? { ...st, status: 'active' as const, activatedAt: new Date() }
            : st
        );
      }
    }

    const updatedPool: Pool = {
      ...pool,
      subtasks,
      updatedAt: new Date(),
    };

    await db.pools.put(updatedPool);
    set((state) => ({
      pools: state.pools.map((p) => (p.id === poolId ? updatedPool : p)),
    }));
  },

  reorderSubtasks: async (poolId, subtaskIds) => {
    const pool = get().getPoolById(poolId);
    if (!pool) return;

    const subtaskMap = new Map(pool.subtasks.map((st) => [st.id, st]));
    const reordered = subtaskIds
      .map((id, index) => {
        const st = subtaskMap.get(id);
        return st ? { ...st, order: index } : null;
      })
      .filter((st): st is PoolSubtask => st !== null);

    const updatedPool: Pool = {
      ...pool,
      subtasks: reordered,
      updatedAt: new Date(),
    };

    await db.pools.put(updatedPool);
    set((state) => ({
      pools: state.pools.map((p) => (p.id === poolId ? updatedPool : p)),
    }));
  },

  completeActiveSubtask: async (poolId) => {
    const pool = get().getPoolById(poolId);
    if (!pool) return;

    const now = new Date();
    let subtasks = pool.subtasks.map((st) =>
      st.status === 'active'
        ? { ...st, status: 'completed' as const, completedAt: now }
        : st
    );

    // Activate next pending subtask
    const nextPending = subtasks.find((st) => st.status === 'pending');
    if (nextPending) {
      subtasks = subtasks.map((st) =>
        st.id === nextPending.id
          ? { ...st, status: 'active' as const, activatedAt: now }
          : st
      );
    }

    const updatedPool: Pool = {
      ...pool,
      subtasks,
      updatedAt: now,
    };

    await db.pools.put(updatedPool);
    set((state) => ({
      pools: state.pools.map((p) => (p.id === poolId ? updatedPool : p)),
    }));
  },

  importPools: async (pools) => {
    for (const pool of pools) {
      await db.pools.put(pool);
    }
    set((state) => ({ pools: [...state.pools, ...pools] }));
  },

  getActiveSubtasks: () => {
    const { pools } = get();
    const result: { pool: Pool; subtask: PoolSubtask }[] = [];

    for (const pool of pools) {
      const active = pool.subtasks.find((st) => st.status === 'active');
      if (active) {
        result.push({ pool, subtask: active });
      }
    }

    return result;
  },
}));
