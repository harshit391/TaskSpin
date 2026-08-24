import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { orderedIds } = await request.json();

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds array required" }, { status: 400 });
  }

  const roadmap = await prisma.roadmap.findFirst({ where: { id, userId } });
  if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  await prisma.$transaction(
    orderedIds.map((taskId: string, index: number) =>
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
