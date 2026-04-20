import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name: string;
    slug?: string;
    industry?: string;
    country?: string;
    subscriptionStatus?: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = body.slug?.trim() || slugify(body.name);
  const existing = await prisma.entity.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

  const entity = await prisma.entity.create({
    data: {
      name: body.name.trim(),
      slug,
      industry: body.industry?.trim() || null,
      country: body.country?.trim() || null,
      subscriptionStatus: body.subscriptionStatus ?? "TRIALING",
    },
  });

  return NextResponse.json(entity, { status: 201 });
}
