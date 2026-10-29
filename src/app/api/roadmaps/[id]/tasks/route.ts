import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { readJson, badRequest } from "@/lib/http";
import { recompactRoadmaps } from "@/lib/roadmap";

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
    where: { roadmapId: id, userId, completed: false },
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
  const body = await readJson(request);
  if (!body) return badRequest();

  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  // Moving an existing task in: it must belong to the user
  let existingTask = null;
  if (body.taskId !== undefined) {
    if (typeof body.taskId !== "string") return badRequest("Invalid taskId");
    existingTask = await prisma.task.findFirst({ where: { id: body.taskId, userId } });
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const maxPos = await prisma.task.aggregate({
    where: { roadmapId: id },
    _max: { roadmapPosition: true },
  });
  const nextPosition = (maxPos._max.roadmapPosition ?? -1) + 1;
  const requested =
    typeof body.position === "number" && Number.isInteger(body.position) ? body.position : nextPosition;
  const position = Math.max(0, Math.min(requested, nextPosition));

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "New task";

  await prisma.$transaction([
    ...(position < nextPosition
      ? [
          prisma.task.updateMany({
            where: { roadmapId: id, roadmapPosition: { gte: position } },
            data: { roadmapPosition: { increment: 1 } },
          }),
        ]
      : []),
    existingTask
      ? prisma.task.update({
          where: { id: existingTask.id },
          data: { roadmapId: id, roadmapPosition: position, projectId: null },
        })
      : prisma.task.create({
          data: { userId, title, roadmapId: id, roadmapPosition: position },
        }),
  ]);

  // A task moved from another roadmap leaves a gap there
  if (existingTask?.roadmapId && existingTask.roadmapId !== id) {
    await recompactRoadmaps([existingTask.roadmapId]);
  }

  const tasks = await prisma.task.findMany({
    where: { roadmapId: id, completed: false },
    orderBy: { roadmapPosition: "asc" },
  });

  return NextResponse.json(tasks, { status: 201 });
}
