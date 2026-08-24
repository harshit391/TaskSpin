import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  const roadmap = await prisma.roadmap.update({
    where: { id },
    data: body,
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

  let taskAction = "move_inbox";
  try {
    const body = await request.json();
    taskAction = body.taskAction ?? "move_inbox";
  } catch {}

  if (taskAction === "delete") {
    await prisma.task.deleteMany({ where: { roadmapId: id } });
  } else {
    await prisma.task.updateMany({
      where: { roadmapId: id },
      data: { roadmapId: null, roadmapPosition: null },
    });
  }

  await prisma.roadmap.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
