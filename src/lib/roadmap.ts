import { prisma } from "@/lib/prisma";

/** Renumber a roadmap's tasks to contiguous 0..n-1 positions, preserving order. */
export async function recompactRoadmaps(roadmapIds: Iterable<string>) {
  for (const roadmapId of new Set(roadmapIds)) {
    const tasks = await prisma.task.findMany({
      where: { roadmapId },
      orderBy: { roadmapPosition: "asc" },
      select: { id: true, roadmapPosition: true },
    });
    const updates = tasks
      .map((t, index) => ({ ...t, index }))
      .filter((t) => t.roadmapPosition !== t.index)
      .map((t) => prisma.task.update({ where: { id: t.id }, data: { roadmapPosition: t.index } }));
    if (updates.length > 0) await prisma.$transaction(updates);
  }
}
