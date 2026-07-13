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
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  project?: Project | null;
}

export type FilterTab = "all" | "active" | "completed";

export type ProjectFilter = "all" | "inbox" | string;
