import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

const PROGRESSIVE_MILESTONES = [7, 21, 66];

function getYesterday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

async function calculateStreak(habitId: string): Promise<{ currentStreak: number; lastCheckedDate: string | null }> {
  const checkins = await prisma.habitCheckin.findMany({
    where: { habitId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (checkins.length === 0) return { currentStreak: 0, lastCheckedDate: null };

  const lastCheckedDate = checkins[0].date;
  let streak = 1;

  for (let i = 1; i < checkins.length; i++) {
    const expected = getYesterday(checkins[i - 1].date);
    if (checkins[i].date === expected) {
      streak++;
    } else {
      break;
    }
  }

  return { currentStreak: streak, lastCheckedDate };
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

  const today = new Intl.DateTimeFormat("en-CA").format(new Date());
  if (date > today) {
    return NextResponse.json({ error: "Cannot check in for future dates" }, { status: 400 });
  }

  try {
    await prisma.habitCheckin.create({ data: { habitId: id, date } });
  } catch {
    return NextResponse.json({ error: "Already checked in for this date" }, { status: 409 });
  }

  const { currentStreak: newStreak, lastCheckedDate } = await calculateStreak(id);
  const newLongest = Math.max(habit.longestStreak, newStreak);
  const isCompleted = habit.goalMode === "single" && habit.goalTarget && newStreak >= habit.goalTarget;

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckedDate,
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

  const { currentStreak, lastCheckedDate } = await calculateStreak(id);

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      currentStreak,
      lastCheckedDate,
      totalCheckins: Math.max(0, habit.totalCheckins - 1),
      ...(habit.completedAt ? { completedAt: null } : {}),
    },
    include: { checkins: { orderBy: { date: "desc" }, take: 66 } },
  });

  return NextResponse.json(updated);
}
