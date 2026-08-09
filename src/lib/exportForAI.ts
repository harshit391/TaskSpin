import { Task, Project } from "@/types/task";

interface ExportData {
  tasks: Task[];
  projects: Project[];
}

export function generateAIExportPrompt({ tasks, projects }: ExportData): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const lines: string[] = [];

  lines.push(`# TaskSpin Export — ${dateStr}`);
  lines.push("");
  lines.push("This is a snapshot of my task management data from TaskSpin. Please analyze it and provide insights.");
  lines.push("");

  // Summary
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const recurringTasks = tasks.filter((t) => t.recurrenceType);

  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total tasks:** ${tasks.length}`);
  lines.push(`- **Active:** ${activeTasks.length}`);
  lines.push(`- **Completed:** ${completedTasks.length}`);
  lines.push(`- **Recurring:** ${recurringTasks.length}`);
  lines.push(`- **Projects:** ${projects.length}`);
  lines.push("");

  // Projects overview
  lines.push("## Projects");
  lines.push("");
  if (projects.length === 0) {
    lines.push("No projects created yet.");
  } else {
    lines.push("| Project | Active | Completed | Total |");
    lines.push("|---------|--------|-----------|-------|");
    for (const project of projects) {
      const pTasks = tasks.filter((t) => t.projectId === project.id);
      const pActive = pTasks.filter((t) => !t.completed).length;
      const pCompleted = pTasks.filter((t) => t.completed).length;
      lines.push(`| ${project.name} | ${pActive} | ${pCompleted} | ${pTasks.length} |`);
    }
    const inboxTasks = tasks.filter((t) => !t.projectId);
    if (inboxTasks.length > 0) {
      const inboxActive = inboxTasks.filter((t) => !t.completed).length;
      const inboxCompleted = inboxTasks.filter((t) => t.completed).length;
      lines.push(`| (Inbox) | ${inboxActive} | ${inboxCompleted} | ${inboxTasks.length} |`);
    }
  }
  lines.push("");

  // Active tasks by project
  lines.push("## Active Tasks");
  lines.push("");

  const projectGroups = new Map<string | null, Task[]>();
  for (const t of activeTasks) {
    const key = t.projectId;
    if (!projectGroups.has(key)) projectGroups.set(key, []);
    projectGroups.get(key)!.push(t);
  }

  for (const project of projects) {
    const group = projectGroups.get(project.id);
    if (!group || group.length === 0) continue;
    lines.push(`### ${project.name}`);
    lines.push("");
    for (const t of group) {
      let meta = "";
      if (t.recurrenceType) meta += ` [recurring: ${t.recurrenceType}${t.recurrenceDays ? ` every ${t.recurrenceDays} days` : ""}]`;
      if (t.sourceTaskId) meta += " [in chain]";
      lines.push(`- ${t.title}${meta}`);
    }
    lines.push("");
  }

  const inboxGroup = projectGroups.get(null);
  if (inboxGroup && inboxGroup.length > 0) {
    lines.push("### Inbox (No Project)");
    lines.push("");
    for (const t of inboxGroup) {
      let meta = "";
      if (t.recurrenceType) meta += ` [recurring: ${t.recurrenceType}${t.recurrenceDays ? ` every ${t.recurrenceDays} days` : ""}]`;
      if (t.sourceTaskId) meta += " [in chain]";
      lines.push(`- ${t.title}${meta}`);
    }
    lines.push("");
  }

  // Completed tasks (recent)
  const recentCompleted = completedTasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 30);

  if (recentCompleted.length > 0) {
    lines.push("## Recently Completed (last 30)");
    lines.push("");
    lines.push("| Task | Project | Completed |");
    lines.push("|------|---------|-----------|");
    for (const t of recentCompleted) {
      const projName = t.project?.name ?? "(Inbox)";
      const date = new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      lines.push(`| ${t.title} | ${projName} | ${date} |`);
    }
    lines.push("");
  }

  // Recurring tasks detail
  if (recurringTasks.length > 0) {
    lines.push("## Recurring Tasks");
    lines.push("");
    lines.push("| Task | Frequency | Project |");
    lines.push("|------|-----------|---------|");
    for (const t of recurringTasks) {
      const freq = t.recurrenceType === "custom" ? `Every ${t.recurrenceDays} days` : (t.recurrenceType ?? "");
      const projName = t.project?.name ?? "(Inbox)";
      lines.push(`| ${t.title} | ${freq} | ${projName} |`);
    }
    lines.push("");
  }

  // AI instructions
  lines.push("## Analysis Instructions");
  lines.push("");
  lines.push("Please analyze this task data and provide insights on:");
  lines.push("1. **Productivity patterns** — Am I completing tasks at a good rate? Any bottlenecks?");
  lines.push("2. **Project balance** — Am I spreading effort across projects or neglecting some?");
  lines.push("3. **Task organization** — Are there tasks that should be grouped, split, or re-prioritized?");
  lines.push("4. **Recurring patterns** — Are my recurring tasks well-structured? Missing any habits?");
  lines.push("5. **Suggestions** — What tasks should I focus on next? Any workflow improvements?");
  lines.push("");

  return lines.join("\n");
}

export function downloadExport(content: string): void {
  const date = new Date().toISOString().split("T")[0];
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskspin-export-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
