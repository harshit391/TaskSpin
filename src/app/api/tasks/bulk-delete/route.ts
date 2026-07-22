import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const ids: string[] = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array" },
      { status: 400 }
    );
  }

  const result = await prisma.task.deleteMany({
    where: { id: { in: ids } },
  });

  return NextResponse.json({ success: true, count: result.count });
}
