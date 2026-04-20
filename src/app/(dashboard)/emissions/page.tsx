import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { formatCO2e } from "@/lib/utils/format";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Emission Records — Carbonly" };

const badgeBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600 };
const scopeBadge: Record<number, React.CSSProperties> = {
  1: { ...badgeBase, background: "#dcfce7", color: "#15803d" },
  2: { ...badgeBase, background: "#dbeafe", color: "#1d4ed8" },
  3: { ...badgeBase, background: "#fef3c7", color: "#b45309" },
};
const badgeGray: React.CSSProperties = { ...badgeBase, background: "#f1f5f9", color: "#475569" };

export default async function EmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; page?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const year = parseInt(params.year ?? String(new Date().getFullYear()));
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;

  const [records, total] = await Promise.all([
    prisma.emissionRecord.findMany({
      where: { entityId: session!.user.entityId!, year },
      include: { activity: { include: { scope: true } }, emissionFactor: true },
      orderBy: { period: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.emissionRecord.count({
      where: { entityId: session!.user.entityId!, year },
    }),
  ]);

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Emission Records</h1>
          <p style={{ fontSize: "0.9375rem", color: "#475569", marginTop: 4 }}>
            {total} record{total !== 1 ? "s" : ""} in {year}
          </p>
        </div>
        <Link href="/scope/1" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 20px", background: "linear-gradient(135deg, #16a34a, #0d9488)", color: "white", fontSize: "0.9375rem", fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", textDecoration: "none" }}>
          <Plus size={15} />
          Add Record
        </Link>
      </div>

      {records.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📋</div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>
            No records yet
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "0 0 20px" }}>
            Start adding emission data using the Scope calculators
          </p>
          <Link href="/scope/1" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #16a34a, #0d9488)", color: "white", fontSize: "0.9375rem", fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", textDecoration: "none" }}>
            Open Calculator
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Scope", "Activity", "Quantity", "CO₂e", "Source"].map((h) => (
                  <th key={h} style={{ background: "#f8fafc", padding: "11px 16px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#475569", whiteSpace: "nowrap" }}>
                    {new Date(r.period).toLocaleDateString("en", { month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a" }}>
                    <span style={scopeBadge[r.activity.scope.number] ?? badgeGray}>
                      Scope {r.activity.scope.number}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 500 }}>{r.activity.name}</td>
                  <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>
                    {r.quantity.toLocaleString()} {r.unit}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 700 }}>
                    {formatCO2e(r.co2eT)}
                    <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>tCO₂e</span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a" }}>
                    <span style={badgeGray}>{r.dataSource}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div
            style={{
              padding: "12px 16px",
              background: "#f1f5f9",
              borderTop: "1px solid #e2e8f0",
              fontSize: "0.8125rem",
              color: "#94a3b8",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {page > 1 && (
                <Link
                  href={`/emissions?year=${year}&page=${page - 1}`}
                  style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none", fontSize: "0.8125rem" }}
                >
                  ← Prev
                </Link>
              )}
              {page * pageSize < total && (
                <Link
                  href={`/emissions?year=${year}&page=${page + 1}`}
                  style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none", fontSize: "0.8125rem" }}
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
