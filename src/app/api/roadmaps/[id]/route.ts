import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { readJson, badRequest } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(request);
  if (!body) return badRequest();

  const existing = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  const data: { title?: string; color?: string } = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) return badRequest("Title is required");
    data.title = body.title.trim();
  }
  if (body.color !== undefined) {
    if (typeof body.color !== "string") return badRequest("Invalid color");
    data.color = body.color;
  }

  const roadmap = await prisma.roadmap.update({
    where: { id },
    data,
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(roadmap);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  const body = await readJson(request);
  const taskAction = body?.taskAction ?? "move_inbox";

  const taskOp =
    taskAction === "delete"
      ? prisma.task.deleteMany({ where: { roadmapId: id, userId } })
      : prisma.task.updateMany({
          where: { roadmapId: id, userId },
          data: { roadmapId: null, roadmapPosition: null },
        });

  await prisma.$transaction([taskOp, prisma.roadmap.delete({ where: { id } })]);

  return NextResponse.json({ success: true });
}
