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

  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const project = await prisma.project.update({
    where: { id },
    data: body,
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  let taskAction = "move_inbox";
  let moveToProjectId: string | null = null;

  try {
    const body = await request.json();
    taskAction = body.taskAction ?? "move_inbox";
    moveToProjectId = body.moveToProjectId ?? null;
  } catch {
    // No body = default to move_inbox
  }

  if (taskAction === "delete") {
    await prisma.task.deleteMany({ where: { projectId: id } });
  } else if (taskAction === "move_project" && moveToProjectId) {
    await prisma.task.updateMany({
      where: { projectId: id },
      data: { projectId: moveToProjectId },
    });
  } else {
    await prisma.task.updateMany({
      where: { projectId: id },
      data: { projectId: null },
    });
  }

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
