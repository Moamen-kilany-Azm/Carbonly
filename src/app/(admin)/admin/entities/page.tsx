import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { EntitiesClient, type AdminEntity } from "@/components/admin/entities-client";

export const metadata: Metadata = { title: "Organisations — Admin" };

export default async function EntitiesPage() {
  const entities = await prisma.entity.findMany({
    include: { _count: { select: { users: true, emissionRecords: true } } },
    orderBy: { createdAt: "desc" },
  });

  const initial: AdminEntity[] = entities.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    industry: e.industry,
    country: e.country,
    subscriptionStatus: e.subscriptionStatus,
    createdAt: e.createdAt.toISOString(),
    userCount: e._count.users,
    recordCount: e._count.emissionRecords,
  }));

  return <EntitiesClient initial={initial} />;
}
