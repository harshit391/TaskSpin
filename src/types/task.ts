export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  project?: Project | null;
  recurrenceType: string | null;
  recurrenceDays: number | null;
  recurrenceWeekdays: string | null;
  recurrenceStartDate: string | null;
  hiddenUntil: string | null;
  sourceTaskId: string | null;
}

export type FilterTab = "all" | "active" | "completed" | "recurring";

export type ProjectFilter = "all" | "inbox" | string;
