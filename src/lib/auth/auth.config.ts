import type { NextAuthConfig } from "next-auth";

/**
 * Lightweight auth config — safe for Edge runtime (no Prisma imports).
 * Used by middleware for route protection.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      // Always allow public paths
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/webhooks");

      if (isPublic) return true;
      if (!isLoggedIn) return false;

      // Demo mode: any authenticated user may view /admin.
      return true;
    },
  },
  providers: [], // Providers added in full auth.ts (Node.js only)
};
