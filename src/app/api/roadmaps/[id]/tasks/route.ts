import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  const tasks = await prisma.task.findMany({
    where: { roadmapId: id, completed: false },
    orderBy: { roadmapPosition: "asc" },
    include: { project: true },
  });

  return NextResponse.json(tasks);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  const maxPos = await prisma.task.aggregate({
    where: { roadmapId: id },
    _max: { roadmapPosition: true },
  });
  const nextPosition = (maxPos._max.roadmapPosition ?? -1) + 1;
  const position = body.position ?? nextPosition;

  if (position < nextPosition) {
    await prisma.task.updateMany({
      where: { roadmapId: id, roadmapPosition: { gte: position } },
      data: { roadmapPosition: { increment: 1 } },
    });
  }

  let task;
  if (body.taskId) {
    task = await prisma.task.update({
      where: { id: body.taskId },
      data: { roadmapId: id, roadmapPosition: position, projectId: null },
    });
  } else {
    task = await prisma.task.create({
      data: { userId, title: body.title?.trim() || "New task", roadmapId: id, roadmapPosition: position },
    });
  }

  const tasks = await prisma.task.findMany({
    where: { roadmapId: id, completed: false },
    orderBy: { roadmapPosition: "asc" },
  });

  return NextResponse.json(tasks, { status: 201 });
}
