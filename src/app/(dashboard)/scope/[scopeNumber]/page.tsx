import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { ScopeCalculator } from "@/components/calculator/scope-calculator";
import { Flame, Zap, Globe } from "lucide-react";

type Props = { params: Promise<{ scopeNumber: string }> };

const scopeMeta: Record<number, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  1: { icon: <Flame size={20} />, color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  2: { icon: <Zap size={20} />, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  3: { icon: <Globe size={20} />, color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scopeNumber } = await params;
  return { title: `Scope ${scopeNumber} Calculator — Carbonly` };
}

export default async function ScopePage({ params }: Props) {
  const { scopeNumber } = await params;
  const num = parseInt(scopeNumber);
  if (![1, 2, 3].includes(num)) notFound();

  const session = await auth();

  const scope = await prisma.scope.findUnique({
    where: { number: num },
    include: {
      activities: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          emissionFactors: {
            where: { isDefault: true },
          },
        },
      },
    },
  });

  if (!scope) notFound();

  const meta = scopeMeta[num];

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: meta.color,
              flexShrink: 0,
            }}
          >
            {meta.icon}
          </div>
          <div>
            <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Scope {num}: {scope.name}</h1>
            {scope.description && (
              <p style={{ fontSize: "0.9375rem", color: "#475569", marginTop: 4 }}>{scope.description}</p>
            )}
          </div>
        </div>
      </div>

      <ScopeCalculator
        scope={scope}
        entityId={session!.user.entityId!}
        userId={session!.user.id}
      />
    </div>
  );
}
