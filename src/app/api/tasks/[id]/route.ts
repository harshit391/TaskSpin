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

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { project: true },
  });

  if (body.completed === true && task.recurrenceType) {
    const hiddenUntil = calculateNextOccurrence(
      task.recurrenceType,
      task.recurrenceDays,
      task.recurrenceStartDate
    );
    await prisma.task.create({
      data: {
        title: task.title,
        projectId: task.projectId,
        recurrenceType: task.recurrenceType,
        recurrenceDays: task.recurrenceDays,
        recurrenceStartDate: task.recurrenceStartDate,
        hiddenUntil,
        sourceTaskId: task.id,
      },
    });
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
