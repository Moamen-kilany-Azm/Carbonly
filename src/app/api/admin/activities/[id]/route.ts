import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.name !== undefined) data.name = body.name?.trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.unit !== undefined) data.unit = body.unit?.trim();
  if (body.equation !== undefined) data.equation = body.equation?.trim();
  if (body.isActive !== undefined) data.isActive = body.isActive;

  try {
    const activity = await prisma.activity.update({ where: { id }, data });
    return NextResponse.json(activity);
  } catch {
    return NextResponse.json({ error: "Failed to update activity" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const factorCount = await prisma.emissionFactor.count({ where: { activityId: id } });
  if (factorCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${factorCount} emission factor(s) still reference this activity` },
      { status: 409 }
    );
  }

  try {
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 400 });
  }
}
