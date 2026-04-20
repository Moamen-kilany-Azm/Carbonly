import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { TotalEmissionsHero } from "@/components/dashboard/total-emissions-hero";
import { ScopeCards } from "@/components/dashboard/scope-cards";
import { ScopeBreakdownChart } from "@/components/dashboard/scope-breakdown-chart";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { TopActivitiesTable } from "@/components/dashboard/top-activities-table";
import { ConsumptionBreakdown } from "@/components/dashboard/consumption-breakdown";
import { YearPicker } from "@/components/dashboard/year-picker";

export const metadata: Metadata = { title: "Dashboard — Carbonly" };

async function getDashboardData(entityId: string, year: number) {
  const [records, prevYearAgg, baselineAgg] = await Promise.all([
    prisma.emissionRecord.findMany({
      where: { entityId, year },
      include: { activity: { include: { scope: true } } },
    }),
    // Previous year total for YoY %
    prisma.emissionRecord.aggregate({
      where: { entityId, year: year - 1 },
      _sum: { co2eT: true },
    }),
    // Baseline (2021) total — only fetch if we're not already in 2021
    year !== 2021
      ? prisma.emissionRecord.aggregate({
          where: { entityId, year: 2021 },
          _sum: { co2eT: true },
        })
      : Promise.resolve({ _sum: { co2eT: null } }),
  ]);

  const totalCo2eT = records.reduce((s, r) => s + r.co2eT, 0);
  const prevYearTotal = prevYearAgg._sum.co2eT ?? null;
  const baselineTotal = baselineAgg._sum.co2eT ?? null;

  // CO2e by scope
  const byScope: Record<number, number> = {};
  const byScopeActivity: Record<number, Record<string, number>> = {};
  for (const r of records) {
    const n = r.activity.scope.number;
    byScope[n] = (byScope[n] ?? 0) + r.co2eT;
    if (!byScopeActivity[n]) byScopeActivity[n] = {};
    byScopeActivity[n][r.activity.name] =
      (byScopeActivity[n][r.activity.name] ?? 0) + r.co2eT;
  }

  // Prev-year by scope for per-card YoY
  const prevRecords = year > 2021
    ? await prisma.emissionRecord.findMany({
        where: { entityId, year: year - 1 },
        include: { activity: { include: { scope: true } } },
      })
    : [];
  const prevByScope: Record<number, number> = {};
  for (const r of prevRecords) {
    const n = r.activity.scope.number;
    prevByScope[n] = (prevByScope[n] ?? 0) + r.co2eT;
  }

  // Monthly trend
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      month,
      total: records.filter((r) => r.month === month).reduce((s, r) => s + r.co2eT, 0),
    };
  });

  // Top 5 activities
  const byActivity: Record<string, number> = {};
  for (const r of records) {
    byActivity[r.activity.name] = (byActivity[r.activity.name] ?? 0) + r.co2eT;
  }
  const topActivities = (Object.entries(byActivity) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, co2eT]) => ({ name, co2eT }));

  // Consumption by unit
  const consumptionMap: Record<string, Record<string, number>> = {};
  for (const r of records) {
    if (!consumptionMap[r.unit]) consumptionMap[r.unit] = {};
    consumptionMap[r.unit][r.activity.name] =
      (consumptionMap[r.unit][r.activity.name] ?? 0) + r.quantity;
  }
  const consumption = (Object.entries(consumptionMap) as [string, Record<string, number>][])
    .map(([unit, m]) => {
      const activities = (Object.entries(m) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .map(([name, quantity]) => ({ name, quantity }));
      return { unit, total: activities.reduce((s, a) => s + a.quantity, 0), activities };
    })
    .sort((a, b) => b.total - a.total);

  return {
    totalCo2eT, prevYearTotal, baselineTotal,
    byScope, prevByScope, byScopeActivity,
    byMonth, topActivities,
    recordCount: records.length, consumption,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const year = parseInt(params.year ?? "2024");
  const data = await getDashboardData(session!.user.entityId!, year);

  const scopeChartData = [
    {
      name: "Scope 1", value: data.byScope[1] ?? 0, color: "#22c55e",
      activities: Object.entries(data.byScopeActivity[1] ?? {})
        .sort(([, a], [, b]) => b - a).map(([name, co2eT]) => ({ name, co2eT })),
    },
    {
      name: "Scope 2", value: data.byScope[2] ?? 0, color: "#3b82f6",
      activities: Object.entries(data.byScopeActivity[2] ?? {})
        .sort(([, a], [, b]) => b - a).map(([name, co2eT]) => ({ name, co2eT })),
    },
    {
      name: "Scope 3", value: data.byScope[3] ?? 0, color: "#f59e0b",
      activities: Object.entries(data.byScopeActivity[3] ?? {})
        .sort(([, a], [, b]) => b - a).map(([name, co2eT]) => ({ name, co2eT })),
    },
  ];

  return (
    <div style={{ width: "100%" }}>

      {/* Page header — server component, use inline styles */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontSize: "1.5rem", fontWeight: 800,
            color: "#0f172a", letterSpacing: "-0.025em",
            margin: 0, lineHeight: 1.2,
          }}>
            Emissions Dashboard
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#64748b", marginTop: 4 }}>
            {year === 2021
              ? "Baseline year \u00b7 GHG Protocol reporting"
              : year === 2026
              ? "Current year \u00b7 Jan\u2013Apr data only"
              : `Full-year report \u00b7 ${data.recordCount} data points`}
          </p>
        </div>
        <YearPicker selected={year} />
      </div>

      {/* Hero: Total Emissions */}
      <TotalEmissionsHero
        total={data.totalCo2eT}
        year={year}
        byMonth={data.byMonth}
        prevYearTotal={data.prevYearTotal}
        baselineTotal={data.baselineTotal}
        scopes={[
          { scope: 1, label: "Scope 1", sub: "Direct", value: data.byScope[1] ?? 0, color: "#4ade80" },
          { scope: 2, label: "Scope 2", sub: "Energy", value: data.byScope[2] ?? 0, color: "#60a5fa" },
          { scope: 3, label: "Scope 3", sub: "Value Chain", value: data.byScope[3] ?? 0, color: "#fbbf24" },
        ]}
      />

      {/* Scope cards with drill-down */}
      <ScopeCards
        totalCo2eT={data.totalCo2eT}
        scopes={[
          {
            scope: 1, label: "Scope 1",
            value: data.byScope[1] ?? 0,
            prevValue: data.prevByScope[1],
            activities: scopeChartData[0].activities,
          },
          {
            scope: 2, label: "Scope 2",
            value: data.byScope[2] ?? 0,
            prevValue: data.prevByScope[2],
            activities: scopeChartData[1].activities,
          },
          {
            scope: 3, label: "Scope 3",
            value: data.byScope[3] ?? 0,
            prevValue: data.prevByScope[3],
            activities: scopeChartData[2].activities,
          },
        ]}
      />

      {/* Charts row — Bootstrap grid */}
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="col-md-5">
          <ScopeBreakdownChart data={scopeChartData} />
        </div>
        <div className="col-md-7">
          <MonthlyTrendChart data={data.byMonth} />
        </div>
      </div>

      {/* Bottom row — Bootstrap grid */}
      <div className="row">
        <div className={data.consumption.length > 0 ? "col-md-7" : "col-12"}>
          <TopActivitiesTable activities={data.topActivities} />
        </div>
        {data.consumption.length > 0 && (
          <div className="col-md-5">
            <ConsumptionBreakdown data={data.consumption} />
          </div>
        )}
      </div>
    </div>
  );
}
