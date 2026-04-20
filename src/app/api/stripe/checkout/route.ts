import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe/client";
import { PLANS, type PlanKey } from "@/lib/stripe/plans";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.entityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planKey } = (await req.json()) as { planKey: PlanKey };
    const plan = PLANS.find((p) => p.key === planKey);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = process.env[plan.priceEnvKey];
    if (!priceId) {
      return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
    }

    const stripe = getStripe();
    const entity = await prisma.entity.findUnique({
      where: { id: session.user.entityId },
      select: { id: true, name: true, stripeCustomerId: true },
    });
    if (!entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    // Create or reuse Stripe customer
    let customerId = entity.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: entity.name,
        email: session.user.email ?? undefined,
        metadata: { entityId: entity.id },
      });
      customerId = customer.id;
      await prisma.entity.update({
        where: { id: entity.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: plan.trial ? 14 : undefined,
        metadata: { entityId: entity.id },
      },
      success_url: `${origin}/dashboard?upgraded=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
