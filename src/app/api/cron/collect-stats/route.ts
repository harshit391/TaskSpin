import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const completedTasks = await prisma.task.findMany({
    where: {
      completed: true,
      updatedAt: { gte: yesterdayStart, lt: yesterdayEnd },
    },
    select: { createdAt: true, updatedAt: true, projectId: true },
  });

  const createdTasks = await prisma.task.findMany({
    where: {
      createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
    },
    select: { projectId: true },
  });

  const activeCount = await prisma.task.count({
    where: { completed: false },
  });

  const projects = await prisma.project.findMany({
    select: { id: true, name: true, color: true },
  });

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  let totalCompletionMs = 0;
  let completionCount = 0;

  const projectStats = new Map<string | null, { completed: number; created: number; active: number }>();

  for (const t of completedTasks) {
    const ms = t.updatedAt.getTime() - t.createdAt.getTime();
    if (ms > 0) {
      totalCompletionMs += ms;
      completionCount++;
    }
    const key = t.projectId;
    const stat = projectStats.get(key) ?? { completed: 0, created: 0, active: 0 };
    stat.completed++;
    projectStats.set(key, stat);
  }

  for (const t of createdTasks) {
    const key = t.projectId;
    const stat = projectStats.get(key) ?? { completed: 0, created: 0, active: 0 };
    stat.created++;
    projectStats.set(key, stat);
  }

  const activeCounts = await prisma.task.groupBy({
    by: ["projectId"],
    where: { completed: false },
    _count: true,
  });

  for (const row of activeCounts) {
    const key = row.projectId;
    const stat = projectStats.get(key) ?? { completed: 0, created: 0, active: 0 };
    stat.active = row._count;
    projectStats.set(key, stat);
  }

  const byProject = Array.from(projectStats.entries()).map(([pid, stat]) => ({
    projectId: pid,
    projectName: pid ? projectMap.get(pid)?.name ?? "Unknown" : "Inbox",
    color: pid ? projectMap.get(pid)?.color ?? "#666" : "#888",
    ...stat,
  }));

  const avgCompletionMs = completionCount > 0 ? totalCompletionMs / completionCount : null;

  await prisma.dailyStats.upsert({
    where: { date: yesterdayStart },
    update: {
      tasksCompleted: completedTasks.length,
      tasksCreated: createdTasks.length,
      tasksActive: activeCount,
      avgCompletionMs,
      byProject,
    },
    create: {
      date: yesterdayStart,
      tasksCompleted: completedTasks.length,
      tasksCreated: createdTasks.length,
      tasksActive: activeCount,
      avgCompletionMs,
      byProject,
    },
  });

  return NextResponse.json({
    date: yesterdayStart.toISOString().split("T")[0],
    tasksCompleted: completedTasks.length,
    tasksCreated: createdTasks.length,
    tasksActive: activeCount,
    avgCompletionMs,
    projectBreakdowns: byProject.length,
  });
}
