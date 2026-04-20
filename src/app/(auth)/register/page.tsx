import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create Account — Carbonly" };

export default function RegisterPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
          Create your account
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "#475569", marginTop: 4 }}>
          Start tracking your carbon emissions today
        </p>
      </div>

      <RegisterForm />

      <p style={{ marginTop: 20, textAlign: "center", fontSize: "0.875rem", color: "#475569" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </>
  );
}
