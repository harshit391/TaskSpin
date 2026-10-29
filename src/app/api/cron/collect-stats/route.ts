import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCronAuthorized } from "@/lib/http";
import { DEFAULT_TIMEZONE, addDaysToKey, dateKeyInZone, startOfDayInZone } from "@/lib/timezone";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // "Yesterday" is the user's local day, not the server's UTC day. The cron runs at
  // 00:05 UTC, which is after midnight in Asia/Kolkata, so this is the day that just ended.
  const todayKey = dateKeyInZone(new Date(), DEFAULT_TIMEZONE);
  const yesterdayKey = addDaysToKey(todayKey, -1);
  const yesterdayStart = startOfDayInZone(yesterdayKey, DEFAULT_TIMEZONE);
  const yesterdayEnd = startOfDayInZone(todayKey, DEFAULT_TIMEZONE);
  // Rows are keyed by calendar date (UTC midnight of that date), matching existing data
  const statsDate = new Date(`${yesterdayKey}T00:00:00.000Z`);

  // Get all distinct userIds
  const users = await prisma.task.groupBy({
    by: ["userId"],
    where: { userId: { not: null } },
  });

  const allUserIds = users.map((u) => u.userId!);
  let totalStats = 0;

  for (const userId of allUserIds) {
    const completedTasks = await prisma.task.findMany({
      where: {
        userId,
        completed: true,
        updatedAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      select: { createdAt: true, updatedAt: true, projectId: true },
    });

    const createdTasks = await prisma.task.findMany({
      where: {
        userId,
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
      },
      select: { projectId: true },
    });

    const activeCount = await prisma.task.count({
      where: { userId, completed: false },
    });

    const projects = await prisma.project.findMany({
      where: { userId },
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
      where: { userId, completed: false },
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
      where: { userId_date: { userId, date: statsDate } },
      update: {
        tasksCompleted: completedTasks.length,
        tasksCreated: createdTasks.length,
        tasksActive: activeCount,
        avgCompletionMs,
        byProject,
      },
      create: {
        userId,
        date: statsDate,
        tasksCompleted: completedTasks.length,
        tasksCreated: createdTasks.length,
        tasksActive: activeCount,
        avgCompletionMs,
        byProject,
      },
    });

    totalStats++;
  }

  return NextResponse.json({
    date: yesterdayKey,
    usersProcessed: totalStats,
  });
}
