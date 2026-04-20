import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { UsersClient, type AdminUser, type AdminEntityOption } from "@/components/admin/users-client";

export const metadata: Metadata = { title: "Users — Admin" };

export default async function UsersPage() {
  const session = await auth();
  const [users, entities] = await Promise.all([
    prisma.user.findMany({
      include: { entities: { include: { entity: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.entity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const initial: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    globalRole: u.globalRole,
    createdAt: u.createdAt.toISOString(),
    entities: u.entities.map((m) => ({ id: m.entity.id, name: m.entity.name })),
  }));

  const entityOptions: AdminEntityOption[] = entities;

  return <UsersClient initial={initial} entities={entityOptions} currentUserId={session?.user?.id ?? ""} />;
}
