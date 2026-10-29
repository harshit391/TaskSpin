import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { readJson, badRequest } from "@/lib/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await readJson(request);
  if (!body) return badRequest();
  const data: { name?: string; archived?: boolean } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) return badRequest("Name is required");
    data.name = body.name.trim();
  }
  if (body.archived !== undefined) {
    if (typeof body.archived !== "boolean") return badRequest("archived must be boolean");
    data.archived = body.archived;
  }

  const habit = await prisma.habit.update({
    where: { id },
    data,
    include: { checkins: { orderBy: { date: "desc" }, take: 66 } },
  });

  return NextResponse.json(habit);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.habit.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
