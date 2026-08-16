import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

async function walkChain(startId: string) {
  const chain = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    projectId: string | null;
    sourceTaskId: string | null;
    recurrenceType: string | null;
    recurrenceDays: number | null;
    recurrenceStartDate: Date | null;
    hiddenUntil: Date | null;
    depth: number;
  }>>`
    WITH RECURSIVE chain AS (
      SELECT t.*, 1 as depth
      FROM "Task" t
      WHERE t."sourceTaskId" = ${startId}
      UNION ALL
      SELECT t.*, c.depth + 1
      FROM "Task" t
      INNER JOIN chain c ON t."sourceTaskId" = c.id
      WHERE c.depth < 50
    )
    SELECT * FROM chain ORDER BY depth
  `;

  if (chain.length === 0) return [];

  const projectIds = [...new Set(chain.filter(t => t.projectId).map(t => t.projectId!))];
  const projects = projectIds.length > 0
    ? await prisma.project.findMany({ where: { id: { in: projectIds } } })
    : [];
  const projectMap = new Map(projects.map(p => [p.id, p]));

  return chain.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    projectId: t.projectId,
    sourceTaskId: t.sourceTaskId,
    recurrenceType: t.recurrenceType,
    recurrenceDays: t.recurrenceDays,
    recurrenceStartDate: t.recurrenceStartDate,
    hiddenUntil: t.hiddenUntil,
    project: t.projectId ? projectMap.get(t.projectId) ?? null : null,
  }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const chain = await walkChain(id);
  return NextResponse.json(chain);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title, insertAfterId, projectId } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const anchorTask = await prisma.task.findFirst({ where: { id, userId } });
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
        userId,
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
