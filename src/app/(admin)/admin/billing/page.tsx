import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { PLANS, getPlanByPriceId } from "@/lib/stripe/plans";
import {
  CreditCard, TrendingUp, Users, CheckCircle, Clock, AlertCircle,
  DollarSign, Building2, Activity,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Billing — Admin" };

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; icon: typeof CheckCircle }> = {
  ACTIVE:    { label: "Active",    bg: "#f0fdf4",  border: "#bbf7d0",  text: "#15803d",  icon: CheckCircle },
  TRIALING:  { label: "Trialing",  bg: "#eff6ff",  border: "#bfdbfe",  text: "#1d4ed8",  icon: Clock },
  PAST_DUE:  { label: "Past due",  bg: "#fffbeb",  border: "#fde68a",  text: "#b45309",  icon: AlertCircle },
  CANCELED:  { label: "Canceled",  bg: "#fef2f2",  border: "#fecaca",  text: "#b91c1c",  icon: AlertCircle },
  UNPAID:    { label: "Unpaid",    bg: "#fef2f2",  border: "#fecaca",  text: "#b91c1c",  icon: AlertCircle },
};

export default async function BillingPage() {
  const entities = await prisma.entity.findMany({
    include: { _count: { select: { users: true, emissionRecords: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Subscription counts
  const counts = entities.reduce((acc, e) => {
    acc[e.subscriptionStatus] = (acc[e.subscriptionStatus] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Plan attribution from stripePriceId
  const planCounts = entities.reduce((acc, e) => {
    const plan = e.stripePriceId ? getPlanByPriceId(e.stripePriceId) : null;
    const key = plan?.key ?? "none";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // MRR estimate (active + trialing, trialing counted at 0)
  const mrr = entities.reduce((sum, e) => {
    if (e.subscriptionStatus !== "ACTIVE") return sum;
    const plan = e.stripePriceId ? getPlanByPriceId(e.stripePriceId) : null;
    return sum + (plan?.monthlyPrice ?? 0);
  }, 0);

  // Trial ending soon (within 7 days)
  const now = Date.now();
  const trialEnding = entities.filter((e) =>
    e.subscriptionStatus === "TRIALING" &&
    e.trialEndsAt &&
    (e.trialEndsAt.getTime() - now) / (1000 * 60 * 60 * 24) <= 7
  );

  const totalCustomers = entities.filter((e) => e.subscriptionStatus === "ACTIVE").length;
  const conversionRate = entities.length > 0 ? (totalCustomers / entities.length) * 100 : 0;

  const kpiGradients: Record<string, string> = {
    "MRR": "linear-gradient(to bottom right, #22c55e, #059669)",
    "Active Customers": "linear-gradient(to bottom right, #3b82f6, #4f46e5)",
    "Conversion": "linear-gradient(to bottom right, #a855f7, #db2777)",
    "Trials Ending": "linear-gradient(to bottom right, #f59e0b, #ea580c)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero */}
      <div style={{
        position: "relative", overflow: "hidden", borderRadius: 16, padding: 32, color: "#fff",
        background: "linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#0e7490 100%)",
      }}>
        <div style={{ position: "absolute", top: -64, right: -64, height: 256, width: 256, borderRadius: 9999, background: "rgba(59,130,246,0.2)", filter: "blur(64px)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(191,219,254,0.8)" }}>Platform Billing</p>
          <h1 style={{ marginTop: 8, fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.025em" }}>Revenue &amp; Subscriptions</h1>
          <p style={{ marginTop: 8, maxWidth: 576, fontSize: "0.875rem", color: "rgba(219,234,254,0.7)" }}>
            Monitor MRR, subscription status, trial conversions and plan distribution across all organisations.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "MRR", value: `£${mrr.toLocaleString()}`, sub: `${totalCustomers} paying customers`, icon: DollarSign },
          { label: "Active Customers", value: totalCustomers.toString(), sub: `${entities.length} total orgs`, icon: Users },
          { label: "Conversion", value: `${conversionRate.toFixed(1)}%`, sub: "trial → paid", icon: TrendingUp },
          { label: "Trials Ending", value: trialEnding.length.toString(), sub: "within 7 days", icon: Clock },
        ].map((kpi) => {
          const I = kpi.icon;
          return (
            <div key={kpi.label} style={{ borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 20, boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>{kpi.label}</p>
                  <p style={{ marginTop: 8, fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{kpi.value}</p>
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 4 }}>{kpi.sub}</p>
                </div>
                <div style={{ display: "flex", height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: 8, background: kpiGradients[kpi.label], color: "#fff", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
                  <I size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan distribution + subscription status */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {/* Plan distribution */}
        <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 20 }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={16} style={{ color: "#6b7280" }} />
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Plan Distribution</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PLANS.map((plan) => {
              const count = planCounts[plan.key] ?? 0;
              const pct = entities.length > 0 ? (count / entities.length) * 100 : 0;
              return (
                <div key={plan.key}>
                  <div style={{ marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1f2937" }}>{plan.name}</span>
                      {plan.monthlyPrice != null && (
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{plan.currency}{plan.monthlyPrice}/mo</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{pct.toFixed(0)}%</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>{count}</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 9999, background: "#f3f4f6" }}>
                    <div
                      style={{
                        height: "100%", borderRadius: 9999, transition: "all 0.15s ease",
                        background: plan.highlight ? "linear-gradient(to right, #22c55e, #14b8a6)" : "#9ca3af",
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "#6b7280" }}>
                <span>No plan</span>
                <span style={{ fontWeight: 600 }}>{planCounts["none"] ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription status */}
        <div style={{ borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", padding: 20 }}>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} style={{ color: "#6b7280" }} />
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Subscription Status</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["ACTIVE","TRIALING","PAST_DUE","CANCELED","UNPAID"] as const).map((status) => {
              const cfg = STATUS_CONFIG[status];
              const count = counts[status] ?? 0;
              const I = cfg.icon;
              const pct = entities.length > 0 ? (count / entities.length) * 100 : 0;
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, border: `1px solid ${cfg.border}`, paddingLeft: 12, paddingRight: 12, paddingTop: 10, paddingBottom: 10, background: cfg.bg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <I size={14} style={{ color: cfg.text }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: cfg.text }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{pct.toFixed(0)}%</span>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: cfg.text }}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trials ending soon */}
      {trialEnding.length > 0 && (
        <div style={{ borderRadius: 12, border: "1px solid #fde68a", background: "rgba(255,251,235,0.5)", padding: 20 }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={16} style={{ color: "#b45309" }} />
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#b45309" }}>Trials Ending Within 7 Days</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trialEnding.map((e) => {
              const days = e.trialEndsAt ? Math.ceil((e.trialEndsAt.getTime() - now) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 8, background: "#fff", paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, background: "linear-gradient(to bottom right, #f59e0b, #ea580c)", fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
                      {e.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{e.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>{e._count.users} users</p>
                    </div>
                  </div>
                  <span style={{ borderRadius: 9999, background: "#fef3c7", paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4, fontSize: "0.75rem", fontWeight: 700, color: "#b45309" }}>
                    {days <= 0 ? "Ending today" : `${days} day${days !== 1 ? "s" : ""} left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full entity billing table */}
      <div style={{ overflow: "hidden", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb", background: "rgba(249,250,251,0.6)", paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={15} style={{ color: "#6b7280" }} />
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>All Subscriptions</h2>
          </div>
          <Link href="/admin/entities" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", textDecoration: "none" }}>Manage entities →</Link>
        </div>
        <table style={{ minWidth: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              {["Organisation", "Plan", "Status", "Trial Ends", "Stripe Customer", "Users", "Joined"].map((h) => (
                <th key={h} style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, textAlign: "left", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entities.map((e) => {
              const cfg = STATUS_CONFIG[e.subscriptionStatus];
              const I = cfg.icon;
              const plan = e.stripePriceId ? getPlanByPriceId(e.stripePriceId) : null;
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, background: "linear-gradient(to bottom right, #22c55e, #0d9488)", fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
                        {e.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, fontSize: "0.875rem" }}>
                    {plan ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#1f2937", fontWeight: 500 }}>{plan.name}</span>
                        {plan.monthlyPrice != null && (
                          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>· {plan.currency}{plan.monthlyPrice}/mo</span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.75rem", fontStyle: "italic" }}>No plan</span>
                    )}
                  </td>
                  <td style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 9999, border: `1px solid ${cfg.border}`, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.text }}>
                      <I size={10} /> {cfg.label}
                    </span>
                  </td>
                  <td style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, fontSize: "0.75rem", color: "#6b7280" }}>
                    {e.trialEndsAt
                      ? new Date(e.trialEndsAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace" }}>
                    {e.stripeCustomerId ? e.stripeCustomerId.slice(0, 18) + "…" : "—"}
                  </td>
                  <td style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, fontSize: "0.875rem", color: "#374151" }}>{e._count.users}</td>
                  <td style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, fontSize: "0.75rem", color: "#6b7280", whiteSpace: "nowrap" }}>
                    {new Date(e.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
