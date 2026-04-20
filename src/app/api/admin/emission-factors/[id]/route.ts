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
  if (body.value !== undefined) data.value = Number(body.value);
  if (body.unit !== undefined) data.unit = body.unit?.trim();
  if (body.source !== undefined) data.source = body.source?.trim() || null;
  if (body.region !== undefined) data.region = body.region?.trim() || null;
  if (body.gwp !== undefined) data.gwp = body.gwp?.trim() || null;

  // Handle default toggle — enforce single default per activity
  if (body.isDefault !== undefined) {
    const current = await prisma.emissionFactor.findUnique({ where: { id } });
    if (current && body.isDefault) {
      await prisma.emissionFactor.updateMany({
        where: { activityId: current.activityId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    data.isDefault = body.isDefault;
  }

  try {
    const factor = await prisma.emissionFactor.update({ where: { id }, data });
    return NextResponse.json(factor);
  } catch {
    return NextResponse.json({ error: "Failed to update factor" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const recordCount = await prisma.emissionRecord.count({ where: { emissionFactorId: id } });
  if (recordCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${recordCount} emission record(s) still use this factor` },
      { status: 409 }
    );
  }

  try {
    await prisma.emissionFactor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete factor" }, { status: 400 });
  }
}
