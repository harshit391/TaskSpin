import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const chain = [];
  let currentId = id;

  for (let i = 0; i < 100; i++) {
    const next = await prisma.task.findUnique({
      where: { sourceTaskId: currentId },
      include: { project: true },
    });
    if (!next) break;
    chain.push(next);
    currentId = next.id;
  }

  return NextResponse.json(chain);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, insertAfterId, projectId } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const anchorTask = await prisma.task.findUnique({ where: { id } });
  if (!anchorTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const insertAfter = insertAfterId || id;

  // Find the tail to append, or validate insertAfterId is in the chain
  let targetId = insertAfter;

  if (!insertAfterId) {
    // Append mode: walk to end of chain
    let currentId = id;
    for (let i = 0; i < 100; i++) {
      const next = await prisma.task.findUnique({
        where: { sourceTaskId: currentId },
      });
      if (!next) break;
      currentId = next.id;
    }
    targetId = currentId;
  }

  // Find the existing child of targetId (if any)
  const existingChild = await prisma.task.findUnique({
    where: { sourceTaskId: targetId },
  });

  // Atomic: create new task and re-link existing child
  const resolvedProjectId = projectId !== undefined ? projectId : anchorTask.projectId;

  await prisma.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        title: title.trim(),
        sourceTaskId: targetId,
        projectId: resolvedProjectId,
      },
    });

    if (existingChild) {
      await tx.task.update({
        where: { id: existingChild.id },
        data: { sourceTaskId: newTask.id },
      });
    }
  });

  // Return updated chain from the anchor task
  const chain = [];
  let currentId = id;
  for (let i = 0; i < 100; i++) {
    const next = await prisma.task.findUnique({
      where: { sourceTaskId: currentId },
      include: { project: true },
    });
    if (!next) break;
    chain.push(next);
    currentId = next.id;
  }

  return NextResponse.json(chain, { status: 201 });
}
