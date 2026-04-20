import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { createEmissionSchema } from "@/lib/validations/emission.schema";
import { calculate } from "@/lib/calculator/engine";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.entityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const records = await prisma.emissionRecord.findMany({
    where: { entityId: session.user.entityId, year },
    include: { activity: { include: { scope: true } }, emissionFactor: true },
    orderBy: { period: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.entityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createEmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { activityId, emissionFactorId, quantity, unit, period, notes } = parsed.data;

  const factor = await prisma.emissionFactor.findUnique({
    where: { id: emissionFactorId },
  });
  if (!factor) {
    return NextResponse.json({ error: "Emission factor not found" }, { status: 404 });
  }

  const { co2eKg, co2eT } = calculate({
    quantity,
    emissionFactorValue: factor.value,
  });

  const periodDate = new Date(period);

  const record = await prisma.emissionRecord.create({
    data: {
      entityId: session.user.entityId,
      userId: session.user.id,
      activityId,
      emissionFactorId,
      quantity,
      unit,
      period: periodDate,
      year: periodDate.getFullYear(),
      month: periodDate.getMonth() + 1,
      notes,
      co2eKg,
      co2eT,
    },
    include: { activity: true, emissionFactor: true },
  });

  return NextResponse.json(record, { status: 201 });
}
