import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    activityId: string;
    name: string;
    value: number;
    unit: string;
    source?: string;
    region?: string;
    gwp?: string;
    isDefault?: boolean;
  };

  if (!body.activityId || !body.name?.trim() || body.value == null || !body.unit?.trim()) {
    return NextResponse.json({ error: "activityId, name, value and unit are required" }, { status: 400 });
  }

  // If marking as default, un-default other factors for the same activity
  if (body.isDefault) {
    await prisma.emissionFactor.updateMany({
      where: { activityId: body.activityId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const factor = await prisma.emissionFactor.create({
    data: {
      activityId: body.activityId,
      name: body.name.trim(),
      value: Number(body.value),
      unit: body.unit.trim(),
      source: body.source?.trim() || null,
      region: body.region?.trim() || null,
      gwp: body.gwp?.trim() || null,
      isDefault: !!body.isDefault,
    },
  });

  return NextResponse.json(factor, { status: 201 });
}
