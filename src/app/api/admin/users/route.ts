import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name?: string;
    email: string;
    password?: string;
    globalRole?: "SUPER_ADMIN" | "ADMIN" | "EXPERT";
    entityId?: string;
    entityRole?: "ADMIN" | "EXPERT";
  };

  if (!body.email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  const email = body.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : null;

  const user = await prisma.user.create({
    data: {
      email,
      name: body.name?.trim() || null,
      passwordHash,
      globalRole: body.globalRole ?? "EXPERT",
      entities: body.entityId
        ? {
            create: { entityId: body.entityId, role: body.entityRole ?? "EXPERT" },
          }
        : undefined,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
