import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const ids: string[] = body.ids;
  const data: { completed?: boolean; projectId?: string | null } = body.data;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array" },
      { status: 400 }
    );
  }

  if (!data || (data.completed === undefined && data.projectId === undefined)) {
    return NextResponse.json(
      { error: "data must contain at least one field to update" },
      { status: 400 }
    );
  }

  if (data.completed === true) {
    const recurringTasks = await prisma.task.findMany({
      where: { id: { in: ids }, userId, recurrenceType: { not: null } },
    });

    if (recurringTasks.length > 0) {
      await prisma.$transaction(
        recurringTasks.map((t) => {
          const hiddenUntil = calculateNextOccurrence(
            t.recurrenceType!,
            t.recurrenceDays,
            t.recurrenceStartDate || new Date(),
            t.recurrenceWeekdays
          );
          return prisma.task.update({
            where: { id: t.id },
            data: { completed: false, hiddenUntil, recurrenceStartDate: hiddenUntil },
          });
        })
      );
    }

    const nonRecurringIds = ids.filter(
      (id) => !recurringTasks.some((t) => t.id === id)
    );

    if (nonRecurringIds.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: nonRecurringIds }, userId },
        data,
      });
    }
  } else {
    await prisma.task.updateMany({
      where: { id: { in: ids }, userId },
      data,
    });
  }

  return NextResponse.json({ success: true, count: ids.length });
}
