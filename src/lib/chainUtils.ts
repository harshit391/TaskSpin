import { Task } from "@/types/task";

export function getRootTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.sourceTaskId === null);
}

export function buildFollowUpMap(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  const childByParent = new Map<string, Task>();

  for (const task of tasks) {
    if (task.sourceTaskId) {
      childByParent.set(task.sourceTaskId, task);
    }
  }

  const rootTasks = tasks.filter((t) => t.sourceTaskId === null);

  for (const root of rootTasks) {
    const chain: Task[] = [];
    let current = childByParent.get(root.id);
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      chain.push(current);
      current = childByParent.get(current.id);
    }

    if (chain.length > 0) {
      map.set(root.id, chain);
    }
  }

  return map;
}

export function findRootForTask(
  taskId: string,
  tasks: Task[]
): string | null {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  let current = taskMap.get(taskId);
  const visited = new Set<string>();

  while (current && current.sourceTaskId && !visited.has(current.id)) {
    visited.add(current.id);
    current = taskMap.get(current.sourceTaskId);
  }

  return current && current.sourceTaskId === null ? current.id : null;
}
