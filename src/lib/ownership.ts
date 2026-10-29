import { prisma } from "@/lib/prisma";

/** True when projectId is null/undefined (no project) or belongs to the user. */
export async function ownsProject(userId: string, projectId: unknown): Promise<boolean> {
  if (projectId === null || projectId === undefined) return true;
  if (typeof projectId !== "string") return false;
  const count = await prisma.project.count({ where: { id: projectId, userId } });
  return count > 0;
}
