import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { FactorsClient, type AdminFactor, type ActivityOption } from "@/components/admin/factors-client";

export const metadata: Metadata = { title: "Emission Factors — Admin" };

export default async function EmissionFactorsPage() {
  const [factors, activities] = await Promise.all([
    prisma.emissionFactor.findMany({
      include: { activity: { include: { scope: true } } },
      orderBy: [{ activity: { scope: { number: "asc" } } }, { activity: { sortOrder: "asc" } }, { name: "asc" }],
    }),
    prisma.activity.findMany({
      where: { isActive: true },
      include: { scope: true },
      orderBy: [{ scope: { number: "asc" } }, { sortOrder: "asc" }],
    }),
  ]);

  const initial: AdminFactor[] = factors.map((f) => ({
    id: f.id,
    activityId: f.activityId,
    activityName: f.activity.name,
    scopeNumber: f.activity.scope.number,
    name: f.name,
    value: f.value,
    unit: f.unit,
    source: f.source,
    region: f.region,
    gwp: f.gwp,
    isDefault: f.isDefault,
  }));

  const activityOptions: ActivityOption[] = activities.map((a) => ({
    id: a.id,
    name: a.name,
    scopeNumber: a.scope.number,
    unit: a.unit,
  }));

  return <FactorsClient initial={initial} activities={activityOptions} />;
}
