import { create } from 'zustand';
import type { Settings, WeeklyCapacity, WeekConfig, DayOfWeek } from '../types';
import { DEFAULT_WEEKLY_CAPACITY, DEFAULT_WEEK_CONFIG } from '../types';
import { db } from '../database/db';

interface SettingsStore {
  settings: Settings;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  updateWeeklyCapacity: (capacity: WeeklyCapacity) => Promise<void>;
  updateDayCapacity: (day: DayOfWeek, capacity: number) => Promise<void>;
  updateWeekConfig: (config: WeekConfig) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  weeklyCapacity: DEFAULT_WEEKLY_CAPACITY,
  weekConfig: DEFAULT_WEEK_CONFIG,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    try {
      const savedSettings = await db.settings.get('default');
      if (savedSettings) {
        set({ settings: savedSettings, isInitialized: true });
      } else {
        // Save default settings to DB
        await db.settings.put(DEFAULT_SETTINGS);
        set({ settings: DEFAULT_SETTINGS, isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      set({ isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updateWeeklyCapacity: async (capacity) => {
    const currentSettings = get().settings;
    const newSettings: Settings = {
      ...currentSettings,
      weeklyCapacity: capacity,
    };
    await db.settings.put(newSettings);
    set({ settings: newSettings });
  },

  updateDayCapacity: async (day, capacity) => {
    const currentSettings = get().settings;
    const newSettings: Settings = {
      ...currentSettings,
      weeklyCapacity: {
        ...currentSettings.weeklyCapacity,
        [day]: Math.max(0, Math.min(20, capacity)), // Clamp between 0 and 20
      },
    };
    await db.settings.put(newSettings);
    set({ settings: newSettings });
  },

  updateWeekConfig: async (config) => {
    const currentSettings = get().settings;
    const newSettings: Settings = {
      ...currentSettings,
      weekConfig: config,
    };
    await db.settings.put(newSettings);
    set({ settings: newSettings });
  },

  resetToDefaults: async () => {
    await db.settings.put(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
