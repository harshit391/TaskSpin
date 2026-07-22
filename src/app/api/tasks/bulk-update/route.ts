import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const ids: string[] = body.ids;
  const data: { completed?: boolean; projectId?: string | null } = body.data;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array" },
      { status: 400 }
    );
  }

  if (!data || (data.completed === undefined && data.projectId === undefined)) {
    return NextResponse.json(
      { error: "data must contain at least one field to update" },
      { status: 400 }
    );
  }

  const result = await prisma.task.updateMany({
    where: { id: { in: ids } },
    data,
  });

  return NextResponse.json({ success: true, count: result.count });
}
