import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const data = { ...body };
  if (data.recurrenceStartDate) {
    data.recurrenceStartDate = new Date(data.recurrenceStartDate);
  }

  if (data.recurrenceType && data.recurrenceStartDate) {
    const nextOccurrence = calculateNextOccurrence(
      data.recurrenceType,
      data.recurrenceDays ?? null,
      data.recurrenceStartDate,
      data.recurrenceWeekdays ?? null
    );
    if (nextOccurrence > new Date()) {
      data.hiddenUntil = nextOccurrence;
    } else {
      data.hiddenUntil = null;
    }
  } else if (data.recurrenceType === null) {
    data.hiddenUntil = null;
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { project: true },
  });

  if (body.completed === true) {
    if (task.recurrenceType) {
      const anchor = task.recurrenceStartDate || new Date();
      const hiddenUntil = calculateNextOccurrence(
        task.recurrenceType,
        task.recurrenceDays,
        anchor,
        task.recurrenceWeekdays
      );

      const existingClone = await prisma.task.findUnique({
        where: { sourceTaskId: task.id },
      });

      if (existingClone) {
        await prisma.task.update({
          where: { id: existingClone.id },
          data: { completed: false, hiddenUntil, recurrenceStartDate: hiddenUntil },
        });
      } else {
        await prisma.task.create({
          data: {
            userId,
            title: task.title,
            projectId: task.projectId,
            recurrenceType: task.recurrenceType,
            recurrenceDays: task.recurrenceDays,
            recurrenceWeekdays: task.recurrenceWeekdays,
            recurrenceStartDate: hiddenUntil,
            hiddenUntil,
            sourceTaskId: task.id,
          },
        });
      }

      return NextResponse.json({ ...task, _cloneHiddenUntil: hiddenUntil.toISOString() });
    } else {
      const child = await prisma.task.findUnique({
        where: { sourceTaskId: id },
      });
      if (child) {
        await prisma.task.update({
          where: { id: child.id },
          data: { sourceTaskId: null },
        });
      }
    }
  }

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

  const child = await prisma.task.findUnique({
    where: { sourceTaskId: id },
  });

  if (child) {
    await prisma.task.update({
      where: { id: child.id },
      data: { sourceTaskId: existing.sourceTaskId ?? null },
    });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
