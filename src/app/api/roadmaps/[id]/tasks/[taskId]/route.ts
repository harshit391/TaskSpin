import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, taskId } = await params;

  const task = await prisma.task.findFirst({ where: { id: taskId, roadmapId: id, userId } });
  if (!task) return NextResponse.json({ error: "Task not found in roadmap" }, { status: 404 });

  await prisma.task.update({
    where: { id: taskId },
    data: { roadmapId: null, roadmapPosition: null },
  });

  await prisma.task.updateMany({
    where: { roadmapId: id, roadmapPosition: { gt: task.roadmapPosition! } },
    data: { roadmapPosition: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
