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
  if (body.name != null) data.name = String(body.name).trim();
  if (body.industry !== undefined) data.industry = body.industry?.trim() || null;
  if (body.country !== undefined) data.country = body.country?.trim() || null;
  if (body.subscriptionStatus) data.subscriptionStatus = body.subscriptionStatus;
  if (body.slug) data.slug = String(body.slug).trim();

  try {
    const entity = await prisma.entity.update({ where: { id }, data });
    return NextResponse.json(entity);
  } catch {
    return NextResponse.json({ error: "Failed to update entity" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.entity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete entity" }, { status: 400 });
  }
}
