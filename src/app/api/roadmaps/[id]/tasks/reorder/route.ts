import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { readJson, isStringArray } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(request);
  const orderedIds = body?.orderedIds;

  if (!isStringArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds array required" }, { status: 400 });
  }

  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  // Only tasks already in this roadmap (and owned by the user) can be reordered
  const owned = await prisma.task.count({ where: { id: { in: orderedIds }, roadmapId: id, userId } });
  if (owned !== new Set(orderedIds).size) {
    return NextResponse.json({ error: "orderedIds must all belong to this roadmap" }, { status: 400 });
  }

  await prisma.$transaction(
    orderedIds.map((taskId, index) =>
      prisma.task.update({
        where: { id: taskId },
        data: { roadmapPosition: index },
      })
    )
  );

  const tasks = await prisma.task.findMany({
    where: { roadmapId: id, completed: false },
    orderBy: { roadmapPosition: "asc" },
  });

  return NextResponse.json(tasks);
}
