"use client";

import { useState } from "react";
import { ExternalLink, Zap, Crown, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BillingSectionProps {
  status: string;
  planName: string | null;
  planHighlight: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE:    { label: "Active",     color: "#16a34a", bg: "rgba(22,163,74,0.12)",   border: "rgba(22,163,74,0.3)"  },
  TRIALING:  { label: "Trial",      color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)" },
  PAST_DUE:  { label: "Past due",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)" },
  CANCELED:  { label: "Canceled",   color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)"  },
  NONE:      { label: "No plan",    color: "#94a3b8", bg: "#f1f5f9", border: "#e2e8f0" },
};

export function BillingSection({
  status,
  planName,
  planHighlight,
  trialEndsAt,
  currentPeriodEnd,
  hasStripeCustomer,
}: BillingSectionProps) {
  const [portalLoading, setPortalLoading] = useState(false);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["NONE"];

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      // fall through
    } finally {
      setPortalLoading(false);
    }
  }

  const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Current plan card */}
      <div style={{
        borderRadius: 12,
        border: planHighlight ? "1.5px solid rgba(22,163,74,0.25)" : "1px solid #e2e8f0",
        background: planHighlight
          ? "linear-gradient(135deg,rgba(22,163,74,0.06),rgba(13,148,136,0.04))"
          : "#f1f5f9",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Plan icon */}
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: planHighlight
              ? "linear-gradient(135deg,rgba(22,163,74,0.2),rgba(13,148,136,0.15))"
              : "#ffffff",
            border: planHighlight ? "1px solid rgba(22,163,74,0.25)" : "1px solid #e2e8f0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: planHighlight ? "#16a34a" : "#94a3b8",
          }}>
            {planName === "Enterprise" ? <Crown size={18} /> : planHighlight ? <Zap size={18} /> : <Shield size={18} />}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                {planName ?? "No plan selected"}
              </span>
              <span style={{
                fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
              }}>
                {cfg.label}
              </span>
            </div>

            {/* Trial / renewal info */}
            {status === "TRIALING" && trialEnd && (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "3px 0 0" }}>
                {daysLeft && daysLeft > 0
                  ? `Trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — ${trialEnd.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`
                  : "Trial has ended"}
              </p>
            )}
            {status === "ACTIVE" && periodEnd && (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "3px 0 0" }}>
                Renews {periodEnd.toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
            {status === "PAST_DUE" && (
              <p style={{ fontSize: "0.8rem", color: "#f59e0b", margin: "3px 0 0", fontWeight: 600 }}>
                Payment required — please update your billing details
              </p>
            )}
            {status === "CANCELED" && (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "3px 0 0" }}>
                Subscription has been canceled
              </p>
            )}
            {(status === "NONE" || !planName) && (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "3px 0 0" }}>
                You are not currently on a paid plan
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {hasStripeCustomer && (status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE") && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "0.8125rem", fontWeight: 600,
                color: "#475569",
                cursor: portalLoading ? "wait" : "pointer",
                opacity: portalLoading ? 0.6 : 1,
                transition: "border-color 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#16a34a";
                (e.currentTarget as HTMLElement).style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLElement).style.color = "#475569";
              }}
            >
              <ExternalLink size={13} />
              {portalLoading ? "Opening…" : "Manage billing"}
            </button>
          )}

          {(status === "NONE" || status === "CANCELED" || status === "TRIALING") && (
            <Link href="/#pricing" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: "linear-gradient(135deg,#16a34a,#0d9488)",
              fontSize: "0.8125rem", fontWeight: 700,
              color: "white", textDecoration: "none",
              boxShadow: "0 2px 10px rgba(22,163,74,0.3)",
              transition: "opacity 0.12s",
            }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              {status === "TRIALING" ? "Upgrade plan" : "Choose a plan"}
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>

      {/* What's included */}
      {planName && (
        <div style={{
          padding: "14px 16px", borderRadius: 10,
          background: "#f1f5f9",
          border: "1px solid #e2e8f0",
          fontSize: "0.8125rem", color: "#94a3b8",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Shield size={13} style={{ flexShrink: 0 }} />
          <span>
            Invoices, payment methods and subscription changes are managed securely via Stripe.{" "}
            {hasStripeCustomer && (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                style={{
                  background: "none", border: "none", padding: 0,
                  color: "#16a34a", fontWeight: 600, cursor: "pointer",
                  fontSize: "0.8125rem",
                }}
              >
                Open billing portal →
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
