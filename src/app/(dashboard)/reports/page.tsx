import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { ReportsClient, type ClientReport } from "@/components/reports/reports-client";

export const metadata: Metadata = { title: "Reports — Carbonly" };

export default async function ReportsPage() {
  const session = await auth();

  const reports = await prisma.report.findMany({
    where: { entityId: session!.user.entityId! },
    orderBy: { createdAt: "desc" },
  });

  const serialised: ClientReport[] = reports.map((r) => ({
    id: r.id,
    year: r.year,
    title: r.title,
    status: r.status as "DRAFT" | "GENERATED" | "PUBLISHED",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    summary: r.summary as any ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <ReportsClient initialReports={serialised} />;
}
