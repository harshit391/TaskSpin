import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";
import { readJson, pick, badRequest, requestTimeZone } from "@/lib/http";
import { startOfDayInZone } from "@/lib/timezone";
import { ownsProject } from "@/lib/ownership";

const EDITABLE_FIELDS = [
  "title",
  "notes",
  "completed",
  "projectId",
  "recurrenceType",
  "recurrenceDays",
  "recurrenceWeekdays",
  "recurrenceStartDate",
  "plannedDate",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(request);
  if (!body) return badRequest();

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const data = pick(body, EDITABLE_FIELDS) as Prisma.TaskUncheckedUpdateInput & Record<string, unknown>;

  if ("title" in data) {
    if (typeof data.title !== "string" || !data.title.trim()) return badRequest("Title is required");
    data.title = data.title.trim();
  }
  if ("completed" in data && typeof data.completed !== "boolean") return badRequest("completed must be boolean");
  if ("projectId" in data && !(await ownsProject(userId, data.projectId))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const timeZone = requestTimeZone(request);

  if (data.recurrenceStartDate) {
    const raw = data.recurrenceStartDate;
    if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return badRequest("Invalid recurrenceStartDate");
    // A picked day means local midnight of that day in the user's timezone
    data.recurrenceStartDate = startOfDayInZone(raw.slice(0, 10), timeZone);
  }

  if (data.recurrenceType === null) {
    data.hiddenUntil = null;
  } else if (data.recurrenceType && !existing.completed) {
    // Future start date: hide until it arrives (shows in Recurring tab meanwhile)
    const start = data.recurrenceStartDate as Date | undefined;
    data.hiddenUntil = start && start > new Date() ? start : null;
  }

  if (data.completed === true && existing.recurrenceType) {
    const anchor = existing.recurrenceStartDate || new Date();
    const hiddenUntil = calculateNextOccurrence(
      existing.recurrenceType,
      existing.recurrenceDays,
      anchor,
      existing.recurrenceWeekdays,
      timeZone
    );

    const task = await prisma.task.update({
      where: { id },
      data: {
        completed: false,
        hiddenUntil,
        recurrenceStartDate: hiddenUntil,
      },
      include: { project: true, roadmap: true },
    });

    return NextResponse.json({ ...task, _cloneHiddenUntil: hiddenUntil.toISOString() });
  }

  const ops: Prisma.PrismaPromise<unknown>[] = [];

  // Leaving a roadmap (completing it, or moving it to a project) recompacts the remaining positions
  const leavesRoadmap =
    existing.roadmapId !== null && (data.completed === true || (data.projectId !== undefined && data.projectId !== null));
  if (leavesRoadmap) {
    data.roadmapId = null;
    data.roadmapPosition = null;
    if (existing.roadmapPosition !== null) {
      ops.push(
        prisma.task.updateMany({
          where: { roadmapId: existing.roadmapId, roadmapPosition: { gt: existing.roadmapPosition } },
          data: { roadmapPosition: { decrement: 1 } },
        })
      );
    }
  }

  const [task] = await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data,
      include: { project: true, roadmap: true },
    }),
    ...ops,
  ]);

  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const ops: Prisma.PrismaPromise<unknown>[] = [prisma.task.delete({ where: { id } })];

  // If task is in a roadmap, recompact positions after deletion
  if (existing.roadmapId && existing.roadmapPosition !== null) {
    ops.push(
      prisma.task.updateMany({
        where: { roadmapId: existing.roadmapId, roadmapPosition: { gt: existing.roadmapPosition } },
        data: { roadmapPosition: { decrement: 1 } },
      })
    );
  }

  await prisma.$transaction(ops);

  return NextResponse.json({ success: true });
}
