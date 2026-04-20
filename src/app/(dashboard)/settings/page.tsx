import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { User, Building2, Shield, Calendar, Mail, Tag, Globe, Factory, CreditCard } from "lucide-react";
import { BillingSection } from "@/components/settings/billing-section";
import { getPlanByPriceId } from "@/lib/stripe/plans";

export const metadata: Metadata = { title: "Settings — Carbonly" };

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {icon}
        {label}
      </label>
      <div style={{ fontSize: "0.9375rem", color: "#0f172a", fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)", padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#16a34a",
          }}
        >
          {icon}
        </div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default async function SettingsPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, globalRole: true, createdAt: true },
  });

  const entity = session!.user.entityId
    ? await prisma.entity.findUnique({
        where: { id: session!.user.entityId },
        select: {
          name: true,
          slug: true,
          industry: true,
          country: true,
          subscriptionStatus: true,
          stripePriceId: true,
          stripeCustomerId: true,
          trialEndsAt: true,
        },
      })
    : null;

  const badgeBase = { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600 } as const;
  const subBadgeStyle =
    entity?.subscriptionStatus === "ACTIVE"
      ? { ...badgeBase, background: "#dcfce7", color: "#15803d" }
      : entity?.subscriptionStatus === "TRIALING"
      ? { ...badgeBase, background: "#dbeafe", color: "#1d4ed8" }
      : { ...badgeBase, background: "#fee2e2", color: "#b91c1c" };

  // Resolve plan from price ID
  const currentPlan = entity?.stripePriceId
    ? getPlanByPriceId(entity.stripePriceId) ?? null
    : null;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Settings</h1>
          <p style={{ fontSize: "0.9375rem", color: "#475569", marginTop: 4 }}>Manage your profile and organization</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Profile */}
        <SectionCard title="Profile" icon={<User size={16} />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <InfoRow
              label="Name"
              icon={<User size={11} />}
              value={user?.name ?? <span style={{ color: "#94a3b8" }}>—</span>}
            />
            <InfoRow
              label="Email"
              icon={<Mail size={11} />}
              value={user?.email}
            />
            <InfoRow
              label="Role"
              icon={<Tag size={11} />}
              value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600, background: "#dcfce7", color: "#15803d" }}>{user?.globalRole}</span>
              }
            />
            <InfoRow
              label="Member since"
              icon={<Calendar size={11} />}
              value={
                user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
            />
          </div>
        </SectionCard>

        {/* Organization */}
        {entity && (
          <SectionCard title="Organization" icon={<Building2 size={16} />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <InfoRow
                label="Name"
                icon={<Building2 size={11} />}
                value={entity.name}
              />
              <InfoRow
                label="Slug"
                icon={<Tag size={11} />}
                value={
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      background: "#f1f5f9",
                      padding: "2px 8px",
                      borderRadius: 5,
                    }}
                  >
                    {entity.slug}
                  </span>
                }
              />
              <InfoRow
                label="Industry"
                icon={<Factory size={11} />}
                value={entity.industry ?? <span style={{ color: "#94a3b8" }}>—</span>}
              />
              <InfoRow
                label="Country"
                icon={<Globe size={11} />}
                value={entity.country ?? <span style={{ color: "#94a3b8" }}>—</span>}
              />
              <InfoRow
                label="Subscription"
                icon={<Tag size={11} />}
                value={
                  <span style={subBadgeStyle}>{entity.subscriptionStatus}</span>
                }
              />
            </div>
          </SectionCard>
        )}

        {/* Billing */}
        {entity && (
          <SectionCard title="Billing &amp; Subscription" icon={<CreditCard size={16} />}>
            <BillingSection
              status={entity.subscriptionStatus ?? "NONE"}
              planName={currentPlan?.name ?? null}
              planHighlight={currentPlan?.highlight ?? false}
              trialEndsAt={entity.trialEndsAt ? entity.trialEndsAt.toISOString() : null}
              currentPeriodEnd={null}
              hasStripeCustomer={!!entity.stripeCustomerId}
            />
          </SectionCard>
        )}

        {/* Security */}
        <SectionCard title="Security" icon={<Shield size={16} />}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "14px 16px",
              background: "#f1f5f9",
              borderRadius: 10,
            }}
          >
            <div>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                Password
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "2px 0 0" }}>
                Password changes coming soon
              </p>
            </div>
            <button
              disabled
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#94a3b8",
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              Change password
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
