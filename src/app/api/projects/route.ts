import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tasks: true } } },
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: { name, color: body.color || "#FF2D6F" },
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
