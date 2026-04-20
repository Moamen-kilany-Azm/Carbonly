import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

// ─── GET /api/reports ─────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.entityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.report.findMany({
    where: { entityId: session.user.entityId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

// ─── POST /api/reports ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.entityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = (await req.json()) as { year: number };
  if (!year || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const entityId = session.user.entityId;

  // Check for existing report
  const existing = await prisma.report.findFirst({
    where: { entityId, year },
  });
  if (existing) {
    return NextResponse.json(
      { error: `A report for ${year} already exists.` },
      { status: 409 }
    );
  }

  // ── Aggregate emission records ──────────────────────────────────────────────
  const [records, baselineAgg, prevYearAgg, entity] = await Promise.all([
    prisma.emissionRecord.findMany({
      where: { entityId, year },
      include: { activity: { include: { scope: true } } },
    }),
    year !== 2021
      ? prisma.emissionRecord.aggregate({
          where: { entityId, year: 2021 },
          _sum: { co2eT: true },
        })
      : Promise.resolve({ _sum: { co2eT: null } }),
    year > 2021
      ? prisma.emissionRecord.aggregate({
          where: { entityId, year: year - 1 },
          _sum: { co2eT: true },
        })
      : Promise.resolve({ _sum: { co2eT: null } }),
    prisma.entity.findUnique({ where: { id: entityId }, select: { name: true } }),
  ]);

  if (records.length === 0) {
    return NextResponse.json(
      { error: `No emission records found for ${year}. Add data before generating a report.` },
      { status: 422 }
    );
  }

  const totalCo2eT = records.reduce((s, r) => s + r.co2eT, 0);
  const baselineCo2eT = baselineAgg._sum.co2eT ?? null;
  const prevYearCo2eT = prevYearAgg._sum.co2eT ?? null;

  const yoyChangePct =
    prevYearCo2eT && prevYearCo2eT > 0
      ? +((((totalCo2eT - prevYearCo2eT) / prevYearCo2eT) * 100).toFixed(2))
      : null;

  const vsBaselinePct =
    baselineCo2eT && baselineCo2eT > 0 && year !== 2021
      ? +((((totalCo2eT - baselineCo2eT) / baselineCo2eT) * 100).toFixed(2))
      : null;

  // By scope
  const scopeMap: Record<number, { co2eT: number; activities: Record<string, number> }> = {};
  for (const r of records) {
    const n = r.activity.scope.number;
    if (!scopeMap[n]) scopeMap[n] = { co2eT: 0, activities: {} };
    scopeMap[n].co2eT += r.co2eT;
    scopeMap[n].activities[r.activity.name] =
      (scopeMap[n].activities[r.activity.name] ?? 0) + r.co2eT;
  }

  const buildScope = (n: number) => {
    const s = scopeMap[n] ?? { co2eT: 0, activities: {} };
    return {
      co2eT: +s.co2eT.toFixed(4),
      pct: totalCo2eT > 0 ? +((s.co2eT / totalCo2eT) * 100).toFixed(1) : 0,
      activities: (Object.entries(s.activities) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .map(([name, co2eT]) => ({ name, co2eT: +co2eT.toFixed(4) })),
    };
  };

  // By month
  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    co2eT: +records
      .filter((r) => r.month === i + 1)
      .reduce((s, r) => s + r.co2eT, 0)
      .toFixed(4),
  }));

  // Top 10 activities
  const activityMap: Record<string, { co2eT: number; scope: number }> = {};
  for (const r of records) {
    if (!activityMap[r.activity.name]) {
      activityMap[r.activity.name] = { co2eT: 0, scope: r.activity.scope.number };
    }
    activityMap[r.activity.name].co2eT += r.co2eT;
  }
  const topActivities = (Object.entries(activityMap) as [string, { co2eT: number; scope: number }][])
    .sort(([, a], [, b]) => b.co2eT - a.co2eT)
    .slice(0, 10)
    .map(([name, { co2eT, scope }]) => ({ name, co2eT: +co2eT.toFixed(4), scope }));

  const summary = {
    totalCo2eT: +totalCo2eT.toFixed(4),
    recordCount: records.length,
    scope1: buildScope(1),
    scope2: buildScope(2),
    scope3: buildScope(3),
    byMonth,
    topActivities,
    baselineCo2eT: baselineCo2eT ? +baselineCo2eT.toFixed(4) : null,
    prevYearCo2eT: prevYearCo2eT ? +prevYearCo2eT.toFixed(4) : null,
    yoyChangePct,
    vsBaselinePct,
    entityName: entity?.name ?? "",
    generatedAt: new Date().toISOString(),
  };

  const report = await prisma.report.create({
    data: {
      entityId,
      year,
      title: `${entity?.name ?? "Organisation"} — GHG Emissions Report ${year}`,
      status: "GENERATED",
      summary,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
