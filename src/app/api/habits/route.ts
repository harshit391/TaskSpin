import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { readJson, badRequest, requestTimeZone } from "@/lib/http";
import { dateKeyInZone } from "@/lib/timezone";

function getYesterday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const todayParam = searchParams.get("today");
  const today = todayParam && /^\d{4}-\d{2}-\d{2}$/.test(todayParam) ? todayParam : dateKeyInZone(new Date(), requestTimeZone(request));
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

  // A streak whose last check-in is older than yesterday is broken. That's derived at read
  // time rather than written back, so a GET never mutates data. The stored value is
  // recomputed from check-ins on the next check-in/undo anyway.
  const result = habits.map((habit) =>
    habit.currentStreak > 0 && habit.lastCheckedDate && habit.lastCheckedDate < yesterday
      ? { ...habit, currentStreak: 0 }
      : habit
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (!body) return badRequest();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const goalMode = typeof body.goalMode === "string" ? body.goalMode : "";
  const goalTarget = typeof body.goalTarget === "number" ? Math.floor(body.goalTarget) : null;

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
