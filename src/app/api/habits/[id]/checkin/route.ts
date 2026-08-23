import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

const PROGRESSIVE_MILESTONES = [7, 21, 66];

function getYesterday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const date = body.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Valid date (YYYY-MM-DD) required" }, { status: 400 });
  }

  try {
    await prisma.habitCheckin.create({ data: { habitId: id, date } });
  } catch {
    return NextResponse.json({ error: "Already checked in for this date" }, { status: 409 });
  }

  const yesterday = getYesterday(date);
  let newStreak: number;
  if (habit.lastCheckedDate === yesterday) {
    newStreak = habit.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(habit.longestStreak, newStreak);
  const isCompleted = habit.goalMode === "single" && habit.goalTarget && newStreak >= habit.goalTarget;

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckedDate: date,
      totalCheckins: habit.totalCheckins + 1,
      ...(isCompleted ? { completedAt: new Date() } : {}),
    },
    include: { checkins: { orderBy: { date: "desc" }, take: 66 } },
  });

  let milestone = null;
  if (habit.goalMode === "progressive" && PROGRESSIVE_MILESTONES.includes(newStreak)) {
    milestone = { hit: true, milestone: newStreak, isCompleted: false };
  } else if (isCompleted) {
    milestone = { hit: true, milestone: habit.goalTarget, isCompleted: true };
  }

  return NextResponse.json({ ...updated, milestone });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const date = body.date;
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  const checkin = await prisma.habitCheckin.findUnique({
    where: { habitId_date: { habitId: id, date } },
  });
  if (!checkin) return NextResponse.json({ error: "No check-in found for this date" }, { status: 404 });

  await prisma.habitCheckin.delete({ where: { id: checkin.id } });

  const prevCheckin = await prisma.habitCheckin.findFirst({
    where: { habitId: id },
    orderBy: { date: "desc" },
  });

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      currentStreak: Math.max(0, habit.currentStreak - 1),
      lastCheckedDate: prevCheckin?.date ?? null,
      totalCheckins: Math.max(0, habit.totalCheckins - 1),
      ...(habit.completedAt ? { completedAt: null } : {}),
    },
    include: { checkins: { orderBy: { date: "desc" }, take: 66 } },
  });

  return NextResponse.json(updated);
}
