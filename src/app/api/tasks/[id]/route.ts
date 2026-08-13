import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextOccurrence } from "@/lib/recurrence";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data = { ...body };
  if (data.recurrenceStartDate) {
    data.recurrenceStartDate = new Date(data.recurrenceStartDate);
  }

  // When recurrence is being set/updated with a start date, calculate hiddenUntil
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
    // Removing recurrence clears hiddenUntil
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
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    select: { sourceTaskId: true },
  });

  const child = await prisma.task.findUnique({
    where: { sourceTaskId: id },
  });

  if (child) {
    await prisma.task.update({
      where: { id: child.id },
      data: { sourceTaskId: task?.sourceTaskId ?? null },
    });
  }

  await prisma.task.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
