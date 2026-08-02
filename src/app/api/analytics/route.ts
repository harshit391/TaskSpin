import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Number(searchParams.get("days")) || 30, 90);

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const stats = await prisma.dailyStats.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(stats);
}
