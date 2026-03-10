export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type FrequencyType = 'daily' | 'once' | 'twice' | 'thrice' | 'custom' | 'one-time';

export interface Task {
  id: string;
  name: string;
  description?: string;
  link?: string; // Optional URL to attach to the task
  frequencyType: FrequencyType;
  frequencyCount: number; // 7 for daily, 1 for once, 2 for twice, etc.
  fixedDays?: DayOfWeek[]; // Optional: specific days this task must appear on
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyCapacity {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface WeekConfig {
  startDay: DayOfWeek;
}

export interface Settings {
  id: string;
  weeklyCapacity: WeeklyCapacity;
  weekConfig: WeekConfig;
}

export interface ScheduledTask {
  taskId: string;
  completed: boolean;
  completedAt?: Date;
  originalDay?: DayOfWeek; // If task was moved from another day due to early completion
}

export interface ScheduledDay {
  day: DayOfWeek;
  date: string; // ISO date string (YYYY-MM-DD)
  tasks: ScheduledTask[];
}

export interface WeeklySchedule {
  id: string;
  weekStartDate: string; // ISO date string
  weekEndDate: string; // ISO date string
  days: ScheduledDay[];
  generatedAt: Date;
}

// Helper type for frequency selection
export interface FrequencyOption {
  type: FrequencyType;
  label: string;
  count: number;
}

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { type: 'daily', label: 'Daily', count: 7 },
  { type: 'once', label: 'Once a week', count: 1 },
  { type: 'twice', label: 'Twice a week', count: 2 },
  { type: 'thrice', label: 'Three times a week', count: 3 },
  { type: 'custom', label: 'Custom', count: 0 },
  { type: 'one-time', label: 'One-time', count: 7 },
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
  sunday: 'SUN',
};

export const DEFAULT_WEEKLY_CAPACITY: WeeklyCapacity = {
  monday: 5,
  tuesday: 5,
  wednesday: 5,
  thursday: 5,
  friday: 5,
  saturday: 3,
  sunday: 3,
};

export const DEFAULT_WEEK_CONFIG: WeekConfig = {
  startDay: 'monday',
};
