export type GoalMode = "single" | "progressive" | "infinite";

export interface HabitCheckin {
  id: string;
  habitId: string;
  date: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  goalMode: GoalMode;
  goalTarget: number | null;
  currentStreak: number;
  longestStreak: number;
  lastCheckedDate: string | null;
  totalCheckins: number;
  completedAt: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  checkins: HabitCheckin[];
}

export interface MilestoneInfo {
  hit: boolean;
  milestone: number | null;
  isCompleted: boolean;
}
