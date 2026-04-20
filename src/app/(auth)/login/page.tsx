import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In — Carbonly" };

export default function LoginPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
          Welcome back
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "#475569", marginTop: 4 }}>
          Sign in to your Carbonly workspace
        </p>
      </div>

      <LoginForm />

      <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.875rem", color: "#475569" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
          Create one free
        </Link>
      </p>
    </>
  );
}
