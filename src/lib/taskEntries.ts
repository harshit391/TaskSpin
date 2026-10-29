import { Task } from "@/types/task";

export type ListEntry =
  | { kind: "task"; task: Task }
  | { kind: "roadmap"; roadmap: NonNullable<Task["roadmap"]>; steps: Task[] };

/**
 * Open tasks from the same roadmap collapse into one stacked entry (next step on top),
 * placed where that next step would have appeared. Single-step roadmaps and completed
 * tasks render as normal rows.
 */
export function buildListEntries(tasks: Task[]): ListEntry[] {
  const byRoadmap = new Map<string, Task[]>();
  for (const t of tasks) {
    if (t.roadmapId && t.roadmap && !t.completed) {
      const group = byRoadmap.get(t.roadmapId) ?? [];
      group.push(t);
      byRoadmap.set(t.roadmapId, group);
    }
  }
  for (const group of byRoadmap.values()) {
    group.sort((a, b) => (a.roadmapPosition ?? Infinity) - (b.roadmapPosition ?? Infinity));
  }

  const entries: ListEntry[] = [];
  for (const t of tasks) {
    const group = t.roadmapId ? byRoadmap.get(t.roadmapId) : undefined;
    if (!group || group.length < 2 || t.completed) {
      entries.push({ kind: "task", task: t });
    } else if (group[0].id === t.id) {
      entries.push({ kind: "roadmap", roadmap: t.roadmap!, steps: group });
    }
    // other steps of a stacked roadmap render inside its stack
  }
  return entries;
}
