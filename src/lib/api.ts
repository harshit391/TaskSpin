import { Task, Project, Roadmap } from "@/types/task";
import { Habit, GoalMode, MilestoneInfo } from "@/types/habit";

const TASKS_BASE = "/api/tasks";
const PROJECTS_BASE = "/api/projects";
const ROADMAPS_BASE = "/api/roadmaps";

// ─── Tasks ───────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(TASKS_BASE);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(
  title: string,
  projectId?: string | null,
  recurrence?: { type: string; days?: number; startDate?: string }
): Promise<Task> {
  const res = await fetch(TASKS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      ...(projectId ? { projectId } : {}),
      ...(recurrence?.type ? { recurrenceType: recurrence.type } : {}),
      ...(recurrence?.type === "custom" && recurrence.days ? { recurrenceDays: recurrence.days } : {}),
      ...(recurrence?.startDate ? { recurrenceStartDate: recurrence.startDate } : {}),
    }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function createTasksBatch(
  titles: string[],
  projectName?: string,
  projectId?: string | null,
  recurrence?: { type: string; days?: number; startDate?: string }
): Promise<Task[]> {
  const res = await fetch(`${TASKS_BASE}/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titles,
      projectName,
      ...(projectId ? { projectId } : {}),
      ...(recurrence?.type ? { recurrenceType: recurrence.type } : {}),
      ...(recurrence?.type === "custom" && recurrence.days ? { recurrenceDays: recurrence.days } : {}),
      ...(recurrence?.startDate ? { recurrenceStartDate: recurrence.startDate } : {}),
    }),
  });
  if (!res.ok) throw new Error("Failed to create tasks");
  return res.json();
}

export async function toggleTask(id: string, completed: boolean): Promise<Task & { _cloneHiddenUntil?: string }> {
  const res = await fetch(`${TASKS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function assignTaskToProject(id: string, projectId: string | null): Promise<Task> {
  const res = await fetch(`${TASKS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error("Failed to assign task");
  return res.json();
}

export async function updateTaskTitle(id: string, title: string): Promise<Task> {
  const res = await fetch(`${TASKS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function updateTaskNotes(id: string, notes: string): Promise<Task> {
  const res = await fetch(`${TASKS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: notes || null }),
  });
  if (!res.ok) throw new Error("Failed to update notes");
  return res.json();
}

export async function setTaskRecurrence(
  id: string,
  recurrenceType: string | null,
  recurrenceDays?: number,
  recurrenceStartDate?: string | null,
  recurrenceWeekdays?: string | null
): Promise<Task> {
  const res = await fetch(`${TASKS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recurrenceType,
      recurrenceDays: (recurrenceType === "custom" && !recurrenceWeekdays) ? (recurrenceDays ?? 7) : null,
      recurrenceWeekdays: (recurrenceType === "custom" && recurrenceWeekdays) ? recurrenceWeekdays : null,
      recurrenceStartDate: recurrenceType
        ? (recurrenceStartDate || new Date().toISOString().split("T")[0])
        : null,
    }),
  });
  if (!res.ok) throw new Error("Failed to set recurrence");
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${TASKS_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
}

export async function bulkDeleteTasks(ids: string[]): Promise<{ count: number }> {
  const res = await fetch(`${TASKS_BASE}/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to delete tasks");
  return res.json();
}

// ─── Roadmaps ───────────────────────────────────────────

export async function fetchRoadmaps(): Promise<Roadmap[]> {
  const res = await fetch(ROADMAPS_BASE);
  if (!res.ok) throw new Error("Failed to fetch roadmaps");
  return res.json();
}

export async function createRoadmap(title: string, color: string): Promise<Roadmap> {
  const res = await fetch(ROADMAPS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, color }),
  });
  if (!res.ok) throw new Error("Failed to create roadmap");
  return res.json();
}

export async function updateRoadmap(id: string, data: { title?: string; color?: string }): Promise<Roadmap> {
  const res = await fetch(`${ROADMAPS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update roadmap");
  return res.json();
}

export async function deleteRoadmap(options: { id: string; taskAction: "delete" | "move_inbox" }): Promise<void> {
  const res = await fetch(`${ROADMAPS_BASE}/${options.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskAction: options.taskAction }),
  });
  if (!res.ok) throw new Error("Failed to delete roadmap");
}

export async function fetchRoadmapTasks(roadmapId: string): Promise<Task[]> {
  const res = await fetch(`${ROADMAPS_BASE}/${roadmapId}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch roadmap tasks");
  return res.json();
}

export async function addTaskToRoadmap(roadmapId: string, data: { taskId?: string; title?: string; position?: number }): Promise<Task[]> {
  const res = await fetch(`${ROADMAPS_BASE}/${roadmapId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add task to roadmap");
  return res.json();
}

export async function removeTaskFromRoadmap(roadmapId: string, taskId: string): Promise<void> {
  const res = await fetch(`${ROADMAPS_BASE}/${roadmapId}/tasks/${taskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove task from roadmap");
}

export async function reorderRoadmapTasks(roadmapId: string, orderedIds: string[]): Promise<Task[]> {
  const res = await fetch(`${ROADMAPS_BASE}/${roadmapId}/tasks/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder roadmap");
  return res.json();
}

export async function bulkUpdateTasks(
  ids: string[],
  data: { completed?: boolean; projectId?: string | null }
): Promise<{ count: number }> {
  const res = await fetch(`${TASKS_BASE}/bulk-update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, data }),
  });
  if (!res.ok) throw new Error("Failed to update tasks");
  return res.json();
}

// ─── Projects ────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(PROJECTS_BASE);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function createProject(name: string, color: string): Promise<Project> {
  const res = await fetch(PROJECTS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(id: string, data: { name?: string; color?: string }): Promise<Project> {
  const res = await fetch(`${PROJECTS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}

export async function deleteProject(options: {
  id: string;
  taskAction: "delete" | "move_inbox" | "move_project";
  moveToProjectId?: string;
}): Promise<void> {
  const res = await fetch(`${PROJECTS_BASE}/${options.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taskAction: options.taskAction,
      moveToProjectId: options.moveToProjectId,
    }),
  });
  if (!res.ok) throw new Error("Failed to delete project");
}

// ─── Habits ─────────────────────────────────────────────

const HABITS_BASE = "/api/habits";

export function getLocalDate(): string {
  return new Intl.DateTimeFormat("en-CA").format(new Date());
}

export async function fetchHabits(): Promise<Habit[]> {
  const today = getLocalDate();
  const res = await fetch(`${HABITS_BASE}?today=${today}`);
  if (!res.ok) throw new Error("Failed to fetch habits");
  return res.json();
}

export async function createHabit(data: { name: string; goalMode: GoalMode; goalTarget?: number }): Promise<Habit> {
  const res = await fetch(HABITS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create habit");
  return res.json();
}

export async function updateHabit(id: string, data: { name?: string; archived?: boolean }): Promise<Habit> {
  const res = await fetch(`${HABITS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update habit");
  return res.json();
}

export async function deleteHabit(id: string): Promise<void> {
  const res = await fetch(`${HABITS_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete habit");
}

export async function checkinHabit(id: string, date: string): Promise<Habit & { milestone?: MilestoneInfo }> {
  const res = await fetch(`${HABITS_BASE}/${id}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!res.ok) throw new Error("Failed to check in");
  return res.json();
}

export async function undoCheckin(id: string, date: string): Promise<Habit> {
  const res = await fetch(`${HABITS_BASE}/${id}/checkin`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!res.ok) throw new Error("Failed to undo check-in");
  return res.json();
}
