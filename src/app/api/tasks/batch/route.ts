import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const titles: string[] = body.titles
    ?.map((t: string) => t.trim())
    .filter((t: string) => t.length > 0);

  if (!titles || titles.length === 0) {
    return NextResponse.json(
      { error: "At least one title is required" },
      { status: 400 }
    );
  }

  let projectId: string | null = null;

  // If a projectName is provided, find or create the project
  if (body.projectName) {
    const name = body.projectName.trim();
    let project = await prisma.project.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name, color: body.projectColor || "#FF2D6F" },
      });
    }

    projectId = project.id;
  }

  const tasks = await prisma.task.createManyAndReturn({
    data: titles.map((title) => ({ title, projectId })),
  });

  return NextResponse.json(tasks, { status: 201 });
}
