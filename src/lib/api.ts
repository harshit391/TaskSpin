import { Task, Project } from "@/types/task";

const TASKS_BASE = "/api/tasks";
const PROJECTS_BASE = "/api/projects";

// ─── Tasks ───────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(TASKS_BASE);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(
  title: string,
  projectId?: string | null,
  recurrence?: { type: string; days?: number }
): Promise<Task> {
  const res = await fetch(TASKS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      ...(projectId ? { projectId } : {}),
      ...(recurrence?.type ? { recurrenceType: recurrence.type } : {}),
      ...(recurrence?.type === "custom" && recurrence.days ? { recurrenceDays: recurrence.days } : {}),
    }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function createTasksBatch(
  titles: string[],
  projectName?: string,
  projectId?: string | null,
  recurrence?: { type: string; days?: number }
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
    }),
  });
  if (!res.ok) throw new Error("Failed to create tasks");
  return res.json();
}

export async function toggleTask(id: string, completed: boolean): Promise<Task> {
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

export async function setTaskRecurrence(
  id: string,
  recurrenceType: string | null,
  recurrenceDays?: number,
  recurrenceStartDate?: string | null
): Promise<Task> {
  const res = await fetch(`${TASKS_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recurrenceType,
      recurrenceDays: recurrenceType === "custom" ? (recurrenceDays ?? 7) : null,
      recurrenceStartDate: recurrenceType ? (recurrenceStartDate || null) : null,
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

export async function fetchFollowUpChain(taskId: string): Promise<Task[]> {
  const res = await fetch(`${TASKS_BASE}/${taskId}/follow-ups`);
  if (!res.ok) throw new Error("Failed to fetch follow-up chain");
  return res.json();
}

export async function addFollowUp(
  taskId: string,
  title: string,
  insertAfterId?: string,
  projectId?: string | null
): Promise<Task[]> {
  const res = await fetch(`${TASKS_BASE}/${taskId}/follow-ups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, insertAfterId, projectId }),
  });
  if (!res.ok) throw new Error("Failed to add follow-up");
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

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${PROJECTS_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}
