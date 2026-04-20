export type PlanKey = "starter" | "professional" | "enterprise";

export type Plan = {
  key: PlanKey;
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  currency: string;
  description: string;
  badge: string | null;
  highlight: boolean;
  trial: string | null;
  cta: string;
  features: string[];
  limits: { users: number; scopes: number[]; historyYears: number };
  priceEnvKey: string;
};

export const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 39,
    currency: "£",
    description: "For small businesses beginning their sustainability journey.",
    badge: null,
    highlight: false,
    trial: "14-day free trial",
    cta: "Start free trial",
    features: [
      "Up to 3 users",
      "Scope 1 & 2 emissions",
      "1 year data history",
      "Core dashboard",
      "CSV export",
      "Email support",
    ],
    limits: { users: 3, scopes: [1, 2], historyYears: 1 },
    priceEnvKey: "STRIPE_PRICE_STARTER",
  },
  {
    key: "professional",
    name: "Professional",
    monthlyPrice: 149,
    annualPrice: 119,
    currency: "£",
    description: "For growing teams with serious decarbonisation targets.",
    badge: "Most Popular",
    highlight: true,
    trial: "14-day free trial",
    cta: "Start free trial",
    features: [
      "Up to 15 users",
      "All scopes — 1, 2 & 3",
      "Unlimited history",
      "Advanced analytics",
      "PDF & CSV reports",
      "REST API access",
      "Priority support",
    ],
    limits: { users: 15, scopes: [1, 2, 3], historyYears: 99 },
    priceEnvKey: "STRIPE_PRICE_PROFESSIONAL",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    currency: "£",
    description: "For large organisations with complex GHG reporting requirements.",
    badge: null,
    highlight: false,
    trial: null,
    cta: "Contact sales",
    features: [
      "Unlimited users",
      "All scopes + custom emission factors",
      "Multi-entity management",
      "GHG audit trails",
      "SSO / SAML",
      "99.9% uptime SLA",
      "Dedicated Customer Success Manager",
    ],
    limits: { users: Infinity, scopes: [1, 2, 3], historyYears: 99 },
    priceEnvKey: "STRIPE_PRICE_ENTERPRISE",
  },
];

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((p) => process.env[p.priceEnvKey] === priceId);
}

export function getPlanByKey(key: PlanKey): Plan {
  return PLANS.find((p) => p.key === key)!;
}
