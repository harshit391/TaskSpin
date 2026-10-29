import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCronAuthorized } from "@/lib/http";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // Age is measured from completion, not creation: a task made months ago but finished
  // yesterday must survive. Completing a task sets updatedAt; a later edit only pushes
  // the cutoff further out, never earlier, so nothing is deleted too soon.
  const result = await prisma.task.deleteMany({
    where: { updatedAt: { lt: cutoff }, completed: true },
  });

  return NextResponse.json({ deleted: result.count });
}
