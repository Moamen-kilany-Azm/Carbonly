import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

// Keep named export for backward compat — accessed lazily via getter
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const STRIPE_PLANS = {
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_STARTER!,
    description: "Up to 3 users, Scope 1 & 2",
    maxUsers: 3,
  },
  PROFESSIONAL: {
    name: "Professional",
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL!,
    description: "Up to 10 users, all scopes, reports",
    maxUsers: 10,
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    description: "Unlimited users, all features, SLA",
    maxUsers: Infinity,
  },
} as const;
