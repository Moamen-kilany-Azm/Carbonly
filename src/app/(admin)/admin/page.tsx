import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
import {
  Building2, Users, Database, Layers, Activity, TrendingUp,
  SlidersHorizontal, CreditCard, CheckCircle, AlertCircle, Clock,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = { title: "Platform Overview — Admin" };

export default async function AdminPage() {
  const [
    entityCount, userCount, recordCount,
    activityCount, factorCount, reportCount,
    entities, recentUsers, recentRecords,
  ] = await Promise.all([
    prisma.entity.count(),
    prisma.user.count(),
    prisma.emissionRecord.count(),
    prisma.activity.count(),
    prisma.emissionFactor.count(),
    prisma.report.count(),
    prisma.entity.findMany({
      include: { _count: { select: { users: true, emissionRecords: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      include: { entities: { include: { entity: true } } },
    }),
    prisma.emissionRecord.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      include: { entity: true, activity: true, user: true },
    }),
  ]);

  const subBreakdown = entities.reduce((acc, e) => {
    acc[e.subscriptionStatus] = (acc[e.subscriptionStatus] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCO2e = await prisma.emissionRecord.aggregate({ _sum: { co2eT: true } });

  const kpis = [
    { label: "Organisations", value: entityCount, icon: Building2, gradient: "linear-gradient(to bottom right, #22c55e, #059669)", href: "/admin/entities" },
    { label: "Users", value: userCount, icon: Users, gradient: "linear-gradient(to bottom right, #3b82f6, #4f46e5)", href: "/admin/users" },
    { label: "Emission Records", value: recordCount, icon: Database, gradient: "linear-gradient(to bottom right, #f59e0b, #ea580c)", href: null },
    { label: "CO₂e Tracked (t)", value: Math.round(totalCO2e._sum.co2eT ?? 0), icon: TrendingUp, gradient: "linear-gradient(to bottom right, #14b8a6, #0891b2)", href: null },
  ];

  const taxonomy = [
    { label: "Scopes", value: 3, icon: Layers, href: "/admin/scopes" },
    { label: "Activities", value: activityCount, icon: Activity, href: "/admin/scopes" },
    { label: "Emission Factors", value: factorCount, icon: SlidersHorizontal, href: "/admin/emission-factors" },
    { label: "Reports Generated", value: reportCount, icon: Database, href: null },
  ];

  const statusConfig: Record<string, { label: string; bg: string; border: string; text: string; icon: typeof CheckCircle }> = {
    ACTIVE:    { label: "Active",    bg: "#f0fdf4",  border: "#bbf7d0",  text: "#15803d",  icon: CheckCircle },
    TRIALING:  { label: "Trialing",  bg: "#eff6ff",  border: "#bfdbfe",  text: "#1d4ed8",  icon: Clock },
    PAST_DUE:  { label: "Past due",  bg: "#fffbeb",  border: "#fde68a",  text: "#b45309",  icon: AlertCircle },
    CANCELED:  { label: "Canceled",  bg: "#fef2f2",  border: "#fecaca",  text: "#b91c1c",  icon: AlertCircle },
    UNPAID:    { label: "Unpaid",    bg: "#fef2f2",  border: "#fecaca",  text: "#b91c1c",  icon: AlertCircle },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero */}
      <div style={{
        position: "relative", overflow: "hidden", borderRadius: 16, padding: 32, color: "#fff",
        background: "linear-gradient(135deg,#052e16 0%,#064e3b 50%,#134e4a 100%)",
      }}>
        <div style={{ position: "absolute", top: -64, right: -64, height: 256, width: 256, borderRadius: 9999, background: "rgba(34,197,94,0.2)", filter: "blur(64px)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, height: 240, width: 240, borderRadius: 9999, background: "rgba(20,184,166,0.15)", filter: "blur(64px)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(134,239,172,0.8)" }}>Platform Overview</p>
          <h1 style={{ marginTop: 8, fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.025em" }}>Carbonly Admin Console</h1>
          <p style={{ marginTop: 8, maxWidth: 576, fontSize: "0.875rem", color: "rgba(220,252,231,0.7)" }}>
            Manage organisations, users, emission factors and platform billing across the entire Carbonly ecosystem.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <Link href="/admin/entities" style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 8, background: "rgba(255,255,255,0.1)", paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, fontSize: "0.875rem", fontWeight: 600, backdropFilter: "blur(4px)", transition: "all 0.15s ease", color: "#fff", textDecoration: "none" }}>
              Manage Entities <ArrowRight size={14} />
            </Link>
            <Link href="/admin/users" style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, fontSize: "0.875rem", fontWeight: 600, transition: "all 0.15s ease", color: "#fff", textDecoration: "none" }}>
              Manage Users
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const card = (
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 20, transition: "all 0.15s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>{kpi.label}</p>
                  <p style={{ marginTop: 8, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{kpi.value.toLocaleString()}</p>
                </div>
                <div style={{ display: "flex", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 8, background: kpi.gradient, color: "#fff", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
                  <Icon size={18} />
                </div>
              </div>
              {kpi.href && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", transition: "color 0.15s, background 0.15s" }}>
                  View details <ArrowRight size={11} />
                </div>
              )}
            </div>
          );
          return kpi.href ? <Link key={kpi.label} href={kpi.href} style={{ textDecoration: "none" }}>{card}</Link> : <div key={kpi.label}>{card}</div>;
        })}
      </div>

      {/* Subscription + taxonomy */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div style={{ gridColumn: "span 2", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 20 }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CreditCard size={16} style={{ color: "#6b7280" }} />
              <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Subscription Status</h2>
            </div>
            <Link href="/admin/billing" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", textDecoration: "none" }}>View billing →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {(["ACTIVE","TRIALING","PAST_DUE","CANCELED","UNPAID"] as const).map((status) => {
              const cfg = statusConfig[status];
              const count = subBreakdown[status] ?? 0;
              const StatusIcon = cfg.icon;
              const pct = entityCount > 0 ? Math.round((count / entityCount) * 100) : 0;
              return (
                <div key={status} style={{ borderRadius: 8, border: `1px solid ${cfg.border}`, padding: 12, background: cfg.bg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: cfg.text }}>
                    <StatusIcon size={12} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cfg.label}</span>
                  </div>
                  <p style={{ marginTop: 8, fontSize: "1.25rem", fontWeight: 700, color: cfg.text }}>{count}</p>
                  <p style={{ fontSize: 11, color: "#6b7280" }}>{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 20 }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Layers size={16} style={{ color: "#6b7280" }} />
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Taxonomy</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {taxonomy.map((t) => {
              const Icon = t.icon;
              const row = (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6, transition: "color 0.15s, background 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon size={14} style={{ color: "#9ca3af" }} />
                    <span style={{ fontSize: "0.875rem", color: "#374151" }}>{t.label}</span>
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>{t.value}</span>
                </div>
              );
              return t.href ? <Link key={t.label} href={t.href} style={{ textDecoration: "none" }}>{row}</Link> : <div key={t.label}>{row}</div>;
            })}
          </div>
        </div>
      </div>

      {/* Organisations + recent users */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Organisations</h2>
            <Link href="/admin/entities" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", textDecoration: "none" }}>View all →</Link>
          </div>
          <div>
            {entities.slice(0, 5).map((e, idx) => {
              const cfg = statusConfig[e.subscriptionStatus];
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12, borderBottom: idx < Math.min(entities.length, 5) - 1 ? "1px solid #e5e7eb" : undefined }}>
                  <div style={{ display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 8, background: "linear-gradient(to bottom right, #22c55e, #0d9488)", fontWeight: 700, color: "#fff", fontSize: "0.75rem" }}>
                    {e.name[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{e.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {e._count.users} users · {e._count.emissionRecords} records
                    </p>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 9999, border: `1px solid ${cfg.border}`, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.text }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
            {entities.length === 0 && (
              <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 32, paddingBottom: 32, textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>No organisations yet</div>
            )}
          </div>
        </div>

        <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12 }}>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Recent Users</h2>
            <Link href="/admin/users" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", textDecoration: "none" }}>View all →</Link>
          </div>
          <div>
            {recentUsers.map((u, idx) => {
              const roleBg = u.globalRole === "SUPER_ADMIN" ? "#ede9fe" : u.globalRole === "ADMIN" ? "#dbeafe" : "#f3f4f6";
              const roleColor = u.globalRole === "SUPER_ADMIN" ? "#7c3aed" : u.globalRole === "ADMIN" ? "#1d4ed8" : "#4b5563";
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12, borderBottom: idx < recentUsers.length - 1 ? "1px solid #e5e7eb" : undefined }}>
                  <div style={{ display: "flex", height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 9999, background: "linear-gradient(to bottom right, #3b82f6, #4f46e5)", fontWeight: 700, color: "#fff", fontSize: "0.75rem" }}>
                    {(u.name ?? u.email)[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{u.name ?? u.email}</p>
                    <p style={{ fontSize: "0.75rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.entities[0]?.entity.name ?? "No organisation"}
                    </p>
                  </div>
                  <span style={{ borderRadius: 9999, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, fontSize: 10, fontWeight: 600, background: roleBg, color: roleColor }}>
                    {u.globalRole}
                  </span>
                </div>
              );
            })}
            {recentUsers.length === 0 && (
              <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 32, paddingBottom: 32, textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>No users yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12 }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Recent Emission Activity</h2>
        </div>
        <div>
          {recentRecords.map((r, idx) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", alignItems: "center", gap: 8, paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12, fontSize: "0.875rem", borderBottom: idx < recentRecords.length - 1 ? "1px solid #e5e7eb" : undefined }}>
              <div style={{ gridColumn: "span 4", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 8, width: 8, borderRadius: 9999, background: "#22c55e" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500, color: "#1f2937" }}>{r.activity.name}</span>
              </div>
              <div style={{ gridColumn: "span 3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#6b7280" }}>{r.entity.name}</div>
              <div style={{ gridColumn: "span 2", color: "#6b7280" }}>{r.quantity} {r.unit}</div>
              <div style={{ gridColumn: "span 2", fontWeight: 600, color: "#15803d" }}>{r.co2eT.toFixed(2)} tCO₂e</div>
              <div style={{ gridColumn: "span 1", textAlign: "right", fontSize: "0.75rem", color: "#9ca3af" }}>
                {new Date(r.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
          {recentRecords.length === 0 && (
            <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 32, paddingBottom: 32, textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>No emission records yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
