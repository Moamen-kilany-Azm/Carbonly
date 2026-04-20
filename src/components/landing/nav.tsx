"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Leaf, Menu, X } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      transition: "background 0.2s ease, border-color 0.2s ease, backdrop-filter 0.2s ease",
      background: scrolled ? "rgba(3,13,5,0.88)" : "transparent",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#16a34a,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(22,163,74,0.4)" }}>
            <Leaf size={16} color="white" />
          </div>
          <span style={{ fontSize: "1.0625rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Carbonly</span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { href: "#features", label: "Features" },
            { href: "#how-it-works", label: "How it works" },
            { href: "#pricing", label: "Pricing" },
          ].map((item) => (
            <a key={item.href} href={item.href} style={{
              padding: "7px 14px", borderRadius: 8, fontSize: "0.9rem",
              fontWeight: 500, color: "rgba(255,255,255,0.65)",
              textDecoration: "none", transition: "color 0.12s ease",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/login" style={{
            padding: "8px 18px", borderRadius: 8, fontSize: "0.875rem",
            fontWeight: 600, color: "rgba(255,255,255,0.7)",
            textDecoration: "none", transition: "color 0.12s",
            border: "none", background: "transparent", cursor: "pointer",
          }}>
            Sign in
          </Link>
          <Link href="/register" style={{
            padding: "9px 20px", borderRadius: 8, fontSize: "0.875rem",
            fontWeight: 700, color: "white", textDecoration: "none",
            background: "linear-gradient(135deg,#16a34a,#0d9488)",
            boxShadow: "0 2px 10px rgba(22,163,74,0.4)",
            transition: "opacity 0.14s, transform 0.14s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}
