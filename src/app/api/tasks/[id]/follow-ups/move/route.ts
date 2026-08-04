import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: anchorId } = await params;
  const body = await request.json();
  const { taskId, insertAfterId } = body;

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  if (taskId === anchorId) {
    return NextResponse.json({ error: "Cannot move a task into its own chain" }, { status: 400 });
  }

  const anchor = await prisma.task.findUnique({ where: { id: anchorId } });
  if (!anchor) {
    return NextResponse.json({ error: "Anchor task not found" }, { status: 404 });
  }

  const movingTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!movingTask) {
    return NextResponse.json({ error: "Task to move not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // Step 1: Detach moving task from its current chain
    const oldChild = await tx.task.findUnique({
      where: { sourceTaskId: taskId },
    });

    if (oldChild) {
      await tx.task.update({
        where: { id: oldChild.id },
        data: { sourceTaskId: movingTask.sourceTaskId },
      });
    }

    // Step 2: Null moving task's sourceTaskId to avoid constraint conflict
    await tx.task.update({
      where: { id: taskId },
      data: { sourceTaskId: null },
    });

    // Step 3: Find insertion target
    let targetId: string;
    if (insertAfterId) {
      targetId = insertAfterId;
    } else {
      // Append to end — walk chain to find tail
      let currentParentId = anchorId;
      while (true) {
        const child = await tx.task.findUnique({
          where: { sourceTaskId: currentParentId },
        });
        if (!child) break;
        currentParentId = child.id;
      }
      targetId = currentParentId;
    }

    // Step 4: Insert into target chain
    const existingChild = await tx.task.findUnique({
      where: { sourceTaskId: targetId },
    });

    await tx.task.update({
      where: { id: taskId },
      data: { sourceTaskId: targetId },
    });

    if (existingChild) {
      await tx.task.update({
        where: { id: existingChild.id },
        data: { sourceTaskId: taskId },
      });
    }
  });

  // Return updated chain
  const chain = [];
  let currentParentId = anchorId;
  const visited = new Set<string>();

  while (true) {
    const child = await prisma.task.findUnique({
      where: { sourceTaskId: currentParentId },
      include: { project: true },
    });
    if (!child || visited.has(child.id)) break;
    visited.add(child.id);
    chain.push(child);
    currentParentId = child.id;
  }

  return NextResponse.json(chain, { status: 200 });
}
