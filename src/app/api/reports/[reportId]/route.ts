import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ reportId: string }> };

// ─── DELETE /api/reports/[reportId] ──────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.entityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.entityId !== session.user.entityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.report.delete({ where: { id: reportId } });
  return NextResponse.json({ ok: true });
}

// ─── PATCH /api/reports/[reportId] — update status ───────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.entityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;
  const body = (await req.json()) as { status?: string };

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.entityId !== session.user.entityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = ["DRAFT", "GENERATED", "PUBLISHED"];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { ...(body.status ? { status: body.status as "DRAFT" | "GENERATED" | "PUBLISHED" } : {}) },
  });

  return NextResponse.json(updated);
}
