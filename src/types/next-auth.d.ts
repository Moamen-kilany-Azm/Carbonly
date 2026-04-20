import { GlobalRole } from "@/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      globalRole: GlobalRole;
      entityId?: string;
      entitySlug?: string;
      entityRole?: string;
    };
  }
}
