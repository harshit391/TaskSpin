import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const project = await prisma.project.update({
    where: { id },
    data: body,
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.task.updateMany({
    where: { projectId: id },
    data: { projectId: null },
  });

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
