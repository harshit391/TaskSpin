import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextOccurrence } from "@/lib/recurrence";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const task = await prisma.task.update({
    where: { id },
    data: body,
    include: { project: true },
  });

  if (body.completed === true && task.recurrenceType) {
    const hiddenUntil = calculateNextOccurrence(task.recurrenceType, task.recurrenceDays);
    await prisma.task.create({
      data: {
        title: task.title,
        projectId: task.projectId,
        recurrenceType: task.recurrenceType,
        recurrenceDays: task.recurrenceDays,
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

  await prisma.task.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
