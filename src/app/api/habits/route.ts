import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

function getYesterday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const today = searchParams.get("today") || new Date().toISOString().split("T")[0];
  const yesterday = getYesterday(today);

  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      checkins: {
        orderBy: { date: "desc" },
        take: 66,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const staleIds: string[] = [];
  for (const habit of habits) {
    if (habit.currentStreak > 0 && habit.lastCheckedDate && habit.lastCheckedDate < yesterday) {
      staleIds.push(habit.id);
      habit.currentStreak = 0;
    }
  }

  if (staleIds.length > 0) {
    await prisma.habit.updateMany({
      where: { id: { in: staleIds } },
      data: { currentStreak: 0 },
    });
  }

  return NextResponse.json(habits);
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = body.name?.trim();
  const goalMode = body.goalMode;
  const goalTarget = body.goalTarget;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!["single", "progressive", "infinite"].includes(goalMode)) {
    return NextResponse.json({ error: "Invalid goal mode" }, { status: 400 });
  }
  if (goalMode === "single" && (!goalTarget || goalTarget < 1)) {
    return NextResponse.json({ error: "Goal target required for single mode" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      userId,
      name,
      goalMode,
      goalTarget: goalMode === "single" ? goalTarget : null,
    },
    include: { checkins: true },
  });

  return NextResponse.json(habit, { status: 201 });
}
