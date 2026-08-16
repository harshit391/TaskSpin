import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orphanedTasks = await prisma.task.count({ where: { userId: null } });
  const orphanedProjects = await prisma.project.count({ where: { userId: null } });
  const orphanedStats = await prisma.dailyStats.count({ where: { userId: null } });

  if (orphanedTasks === 0 && orphanedProjects === 0 && orphanedStats === 0) {
    return NextResponse.json({ claimed: false, message: "No orphaned data" });
  }

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { userId: null },
      data: { userId },
    }),
    prisma.project.updateMany({
      where: { userId: null },
      data: { userId },
    }),
    prisma.dailyStats.updateMany({
      where: { userId: null },
      data: { userId },
    }),
  ]);

  return NextResponse.json({
    claimed: true,
    tasks: orphanedTasks,
    projects: orphanedProjects,
    stats: orphanedStats,
  });
}
