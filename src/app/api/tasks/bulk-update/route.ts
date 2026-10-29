import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";
import { readJson, isStringArray, requestTimeZone } from "@/lib/http";
import { ownsProject } from "@/lib/ownership";
import { recompactRoadmaps } from "@/lib/roadmap";

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  const ids = body?.ids;
  const raw = (body?.data ?? null) as { completed?: unknown; projectId?: unknown } | null;

  if (!isStringArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array" },
      { status: 400 }
    );
  }

  // Whitelist: only completed and projectId may be bulk-updated
  const data: { completed?: boolean; projectId?: string | null } = {};
  if (raw && typeof raw.completed === "boolean") data.completed = raw.completed;
  if (raw && (raw.projectId === null || typeof raw.projectId === "string")) data.projectId = raw.projectId;

  if (data.completed === undefined && data.projectId === undefined) {
    return NextResponse.json(
      { error: "data must contain at least one field to update" },
      { status: 400 }
    );
  }

  if (data.projectId && !(await ownsProject(userId, data.projectId))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  let remainingIds = ids;

  if (data.completed === true) {
    const timeZone = requestTimeZone(request);
    const recurringTasks = await prisma.task.findMany({
      where: { id: { in: ids }, userId, recurrenceType: { not: null } },
    });

    for (const t of recurringTasks) {
      const hiddenUntil = calculateNextOccurrence(
        t.recurrenceType!,
        t.recurrenceDays,
        t.recurrenceStartDate || new Date(),
        t.recurrenceWeekdays,
        timeZone
      );
      ops.push(
        prisma.task.update({
          where: { id: t.id },
          data: { completed: false, hiddenUntil, recurrenceStartDate: hiddenUntil },
        })
      );
    }

    const recurringIds = new Set(recurringTasks.map((t) => t.id));
    remainingIds = ids.filter((id) => !recurringIds.has(id));
  }

  // Completing or moving to a project takes tasks out of their roadmap (mirrors single-task PATCH)
  const leavesRoadmap = data.completed === true || !!data.projectId;
  const roadmapTasks = leavesRoadmap && remainingIds.length > 0
    ? await prisma.task.findMany({
        where: { id: { in: remainingIds }, userId, roadmapId: { not: null } },
        select: { roadmapId: true },
      })
    : [];

  if (remainingIds.length > 0) {
    ops.push(
      prisma.task.updateMany({
        where: { id: { in: remainingIds }, userId },
        data: leavesRoadmap ? { ...data, roadmapId: null, roadmapPosition: null } : data,
      })
    );
  }

  await prisma.$transaction(ops);

  if (roadmapTasks.length > 0) {
    await recompactRoadmaps(roadmapTasks.map((t) => t.roadmapId!));
  }

  return NextResponse.json({ success: true, count: ids.length });
}
