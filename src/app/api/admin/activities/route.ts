import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    scopeId: string;
    name: string;
    description?: string;
    unit: string;
    equation?: string;
    isActive?: boolean;
  };

  if (!body.scopeId || !body.name?.trim() || !body.unit?.trim()) {
    return NextResponse.json({ error: "scopeId, name and unit are required" }, { status: 400 });
  }

  const maxSort = await prisma.activity.findFirst({
    where: { scopeId: body.scopeId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true },
  });

  const activity = await prisma.activity.create({
    data: {
      scopeId: body.scopeId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      unit: body.unit.trim(),
      equation: body.equation?.trim() || "quantity × emissionFactor",
      isActive: body.isActive ?? true,
      sortOrder: (maxSort?.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
