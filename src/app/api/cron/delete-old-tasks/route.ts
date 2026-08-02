import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const result = await prisma.task.deleteMany({
    where: { createdAt: { lt: cutoff }, completed: true },
  });

  return NextResponse.json({ deleted: result.count });
}
