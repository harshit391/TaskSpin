import { Task, Project } from "@/types/task";

const TASKS_BASE = "/api/tasks";
const PROJECTS_BASE = "/api/projects";

// ─── Tasks ───────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(TASKS_BASE);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(title: string): Promise<Task> {
  const res = await fetch(TASKS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function createTasksBatch(titles: string[], projectName?: string): Promise<Task[]> {
  const res = await fetch(`${TASKS_BASE}/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titles, projectName }),
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

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${TASKS_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
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
