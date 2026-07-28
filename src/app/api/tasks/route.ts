import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ hiddenUntil: null }, { hiddenUntil: { lte: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    include: { project: true },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      title,
      ...(body.projectId ? { projectId: body.projectId } : {}),
      ...(body.recurrenceType ? { recurrenceType: body.recurrenceType } : {}),
      ...(body.recurrenceDays ? { recurrenceDays: body.recurrenceDays } : {}),
    },
    include: { project: true },
  });

  return NextResponse.json(task, { status: 201 });
}
