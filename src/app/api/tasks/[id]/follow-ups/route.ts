import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function walkChain(startId: string) {
  const allTasks = await prisma.task.findMany({
    where: { sourceTaskId: { not: null } },
    include: { project: true },
  });

  const childByParent = new Map<string, typeof allTasks[number]>();
  for (const t of allTasks) {
    if (t.sourceTaskId) childByParent.set(t.sourceTaskId, t);
  }

  const chain = [];
  let current = childByParent.get(startId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    chain.push(current);
    current = childByParent.get(current.id);
  }

  return chain;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chain = await walkChain(id);
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

  let targetId: string;

  if (insertAfterId) {
    targetId = insertAfterId;
  } else {
    const chain = await walkChain(id);
    targetId = chain.length > 0 ? chain[chain.length - 1].id : id;
  }

  const existingChild = await prisma.task.findUnique({
    where: { sourceTaskId: targetId },
  });

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

  const updatedChain = await walkChain(id);
  return NextResponse.json(updatedChain, { status: 201 });
}
