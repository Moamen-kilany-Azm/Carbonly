import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { ScopesClient, type AdminScope } from "@/components/admin/scopes-client";

export const metadata: Metadata = { title: "Scopes & Activities — Admin" };

export default async function ScopesPage() {
  const scopes = await prisma.scope.findMany({
    include: {
      activities: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { emissionFactors: true } } },
      },
    },
    orderBy: { number: "asc" },
  });

  const initial: AdminScope[] = scopes.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name,
    description: s.description,
    activities: s.activities.map((a) => ({
      id: a.id, name: a.name, description: a.description, unit: a.unit,
      equation: a.equation, isActive: a.isActive, sortOrder: a.sortOrder,
      factorCount: a._count.emissionFactors,
    })),
  }));

  return <ScopesClient initial={initial} />;
}
