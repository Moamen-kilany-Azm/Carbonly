import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getStripe } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.entityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entity = await prisma.entity.findUnique({
      where: { id: session.user.entityId },
      select: { stripeCustomerId: true },
    });

    if (!entity?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const stripe = getStripe();
    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: entity.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
