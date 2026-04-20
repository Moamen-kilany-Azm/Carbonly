import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Use only the edge-safe config in middleware (no Prisma / Node.js-only imports)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
