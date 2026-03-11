'use client';

import { useEffect, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { useScheduleStore } from '../store/scheduleStore';
import { usePoolStore } from '../store/poolStore';
import { useSideTaskStore } from '../store/sideTaskStore';

export function useInitialize() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeTasks = useTaskStore((state) => state.initialize);
  const initializeSettings = useSettingsStore((state) => state.initialize);
  const initializeSchedule = useScheduleStore((state) => state.initialize);
  const initializePools = usePoolStore((state) => state.initialize);
  const initializeSideTasks = useSideTaskStore((state) => state.initialize);

  const tasksInitialized = useTaskStore((state) => state.isInitialized);
  const settingsInitialized = useSettingsStore((state) => state.isInitialized);
  const scheduleInitialized = useScheduleStore((state) => state.isInitialized);
  const poolsInitialized = usePoolStore((state) => state.isInitialized);
  const sideTasksInitialized = useSideTaskStore((state) => state.isInitialized);

  useEffect(() => {
    async function init() {
      try {
        await initializeSettings();
        await initializeTasks();
        await initializePools();
        await initializeSideTasks();
        await initializeSchedule();
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }

    init();
  }, [initializeTasks, initializeSettings, initializePools, initializeSideTasks, initializeSchedule]);

  useEffect(() => {
    if (tasksInitialized && settingsInitialized && poolsInitialized && sideTasksInitialized && scheduleInitialized) {
      setIsReady(true);
    }
  }, [tasksInitialized, settingsInitialized, poolsInitialized, sideTasksInitialized, scheduleInitialized]);

  return { isReady, error };
}
