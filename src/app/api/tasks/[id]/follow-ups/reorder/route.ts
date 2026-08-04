import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

  // Build CASE expression: each task gets its new sourceTaskId in one UPDATE
  // orderedIds[0] → anchorId, orderedIds[1] → orderedIds[0], etc.
  const parentIds = [anchorId, ...orderedIds.slice(0, -1)];
  const allIds = orderedIds;

  // Single transaction with 2 SQL statements instead of N+1 Prisma calls
  // Pass 1: null all to avoid unique constraint violations
  // Pass 2: set new order via CASE
  const whenClauses = allIds
    .map((id, i) => Prisma.sql`WHEN id = ${id} THEN ${parentIds[i]}`)
    .reduce((acc, clause) => Prisma.sql`${acc} ${clause}`);

  await prisma.$transaction([
    prisma.$executeRaw`UPDATE "Task" SET "sourceTaskId" = NULL WHERE id IN (${Prisma.join(allIds)})`,
    prisma.$executeRaw`UPDATE "Task" SET "sourceTaskId" = CASE ${whenClauses} END, "updatedAt" = NOW() WHERE id IN (${Prisma.join(allIds)})`,
  ]);

  // Fetch the reordered chain in one query (ordered by the client's order)
  const chain = await prisma.task.findMany({
    where: { id: { in: allIds } },
    include: { project: true },
  });

  // Sort by the requested order
  const idIndex = new Map(allIds.map((id, i) => [id, i]));
  chain.sort((a, b) => (idIndex.get(a.id) ?? 0) - (idIndex.get(b.id) ?? 0));

  return NextResponse.json(chain);
}
