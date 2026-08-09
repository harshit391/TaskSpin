import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

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
  const { id } = await params;

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
