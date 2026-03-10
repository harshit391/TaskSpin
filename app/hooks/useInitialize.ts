'use client';

import { useEffect, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { useScheduleStore } from '../store/scheduleStore';

export function useInitialize() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeTasks = useTaskStore((state) => state.initialize);
  const initializeSettings = useSettingsStore((state) => state.initialize);
  const initializeSchedule = useScheduleStore((state) => state.initialize);

  const tasksInitialized = useTaskStore((state) => state.isInitialized);
  const settingsInitialized = useSettingsStore((state) => state.isInitialized);
  const scheduleInitialized = useScheduleStore((state) => state.isInitialized);

  useEffect(() => {
    async function init() {
      try {
        // Initialize in order: settings first (needed for schedule), then tasks, then schedule
        await initializeSettings();
        await initializeTasks();
        await initializeSchedule();
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }

    init();
  }, [initializeTasks, initializeSettings, initializeSchedule]);

  useEffect(() => {
    if (tasksInitialized && settingsInitialized && scheduleInitialized) {
      setIsReady(true);
    }
  }, [tasksInitialized, settingsInitialized, scheduleInitialized]);

  return { isReady, error };
}
