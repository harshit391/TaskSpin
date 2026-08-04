import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: anchorId } = await params;
  const body = await request.json();
  const { orderedIds } = body;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
  }

  const anchor = await prisma.task.findUnique({ where: { id: anchorId } });
  if (!anchor) {
    return NextResponse.json({ error: "Anchor task not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    // Pass 1: Null all sourceTaskIds to avoid unique constraint violations
    await tx.task.updateMany({
      where: { id: { in: orderedIds } },
      data: { sourceTaskId: null },
    });

    // Pass 2: Reassign in new order
    await tx.task.update({
      where: { id: orderedIds[0] },
      data: { sourceTaskId: anchorId },
    });

    for (let i = 1; i < orderedIds.length; i++) {
      await tx.task.update({
        where: { id: orderedIds[i] },
        data: { sourceTaskId: orderedIds[i - 1] },
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

  return NextResponse.json(chain);
}
