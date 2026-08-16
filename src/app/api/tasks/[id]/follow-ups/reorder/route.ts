import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: anchorId } = await params;
  const body = await request.json();
  const { orderedIds } = body;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
  }

  const anchor = await prisma.task.findFirst({ where: { id: anchorId, userId } });
  if (!anchor) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const parentIds = [anchorId, ...orderedIds.slice(0, -1)];
  const allIds = orderedIds;

  const whenClauses = allIds
    .map((id, i) => Prisma.sql`WHEN id = ${id} THEN ${parentIds[i]}`)
    .reduce((acc, clause) => Prisma.sql`${acc} ${clause}`);

  await prisma.$transaction([
    prisma.$executeRaw`UPDATE "Task" SET "sourceTaskId" = NULL WHERE id IN (${Prisma.join(allIds)})`,
    prisma.$executeRaw`UPDATE "Task" SET "sourceTaskId" = CASE ${whenClauses} END, "updatedAt" = NOW() WHERE id IN (${Prisma.join(allIds)})`,
  ]);

  const chain = await prisma.task.findMany({
    where: { id: { in: allIds } },
    include: { project: true },
  });

  const idIndex = new Map(allIds.map((id, i) => [id, i]));
  chain.sort((a, b) => (idIndex.get(a.id) ?? 0) - (idIndex.get(b.id) ?? 0));

  return NextResponse.json(chain);
}
