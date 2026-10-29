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

  const existing = await prisma.project.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const data: { name?: string; color?: string } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) return badRequest("Name is required");
    data.name = body.name.trim();
  }
  if (body.color !== undefined) {
    if (typeof body.color !== "string") return badRequest("Invalid color");
    data.color = body.color;
  }

  const project = await prisma.project.update({
    where: { id },
    data,
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

  // No body = default to move_inbox
  const body = await readJson(request);
  const taskAction = body?.taskAction ?? "move_inbox";
  const moveToProjectId = typeof body?.moveToProjectId === "string" ? body.moveToProjectId : null;

  let taskOp;
  if (taskAction === "delete") {
    taskOp = prisma.task.deleteMany({ where: { projectId: id, userId } });
  } else if (taskAction === "move_project" && moveToProjectId) {
    const target = await prisma.project.findFirst({ where: { id: moveToProjectId, userId } });
    if (!target || target.id === id) {
      return NextResponse.json({ error: "Target project not found" }, { status: 404 });
    }
    taskOp = prisma.task.updateMany({
      where: { projectId: id, userId },
      data: { projectId: moveToProjectId },
    });
  } else {
    taskOp = prisma.task.updateMany({
      where: { projectId: id, userId },
      data: { projectId: null },
    });
  }

  await prisma.$transaction([taskOp, prisma.project.delete({ where: { id } })]);

  return NextResponse.json({ success: true });
}
