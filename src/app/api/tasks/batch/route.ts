import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PROJECT_COLORS = [
  "#FF2D6F", "#6366F1", "#F59E0B", "#10B981", "#EC4899",
  "#8B5CF6", "#14B8A6", "#F97316", "#06B6D4", "#EF4444",
  "#84CC16", "#A855F7", "#0EA5E9", "#D946EF", "#22C55E",
];

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

  let projectId: string | null = body.projectId || null;

  // If a projectName is provided, find or create the project
  if (body.projectName) {
    const name = body.projectName.trim();
    let project = await prisma.project.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (!project) {
      const count = await prisma.project.count();
      const color = body.projectColor || PROJECT_COLORS[count % PROJECT_COLORS.length];
      project = await prisma.project.create({
        data: { name, color },
      });
    }

    projectId = project.id;
  }

  const tasks = await prisma.task.createManyAndReturn({
    data: titles.map((title) => ({ title, projectId })),
  });

  return NextResponse.json(tasks, { status: 201 });
}
