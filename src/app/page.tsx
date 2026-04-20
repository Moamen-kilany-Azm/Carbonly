"use client";

import Link from "next/link";
import { useState } from "react";
import { LandingNav } from "@/components/landing/nav";
import { HowItWorks } from "@/components/landing/how-it-works";
import {
  AnimationStyles,
  Reveal,
  Stagger,
  CountUp,
  Float,
  GlowCard,
  TypewriterBadge,
} from "@/components/landing/animations";
import { PLANS } from "@/lib/stripe/plans";
import {
  Leaf,
  BarChart3,
  FileText,
  Zap,
  Globe2,
  ShieldCheck,
  Users,
  TrendingDown,
  ChevronRight,
  Check,
  ArrowRight,
  Star,
  Building2,
  Factory,
  Truck,
} from "lucide-react";

// ─── Pricing CTA ──────────────────────────────────────────────────────────────

function PricingCTA({ planKey, cta, highlight }: { planKey: string; cta: string; highlight: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (planKey === "enterprise") {
      window.location.href = "mailto:sales@carbonly.io?subject=Enterprise enquiry";
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      if (res.status === 401) { window.location.href = "/register"; return; }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      window.location.href = "/register";
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        width: "100%", padding: "13px 20px", borderRadius: 10,
        fontWeight: 700, fontSize: "0.9375rem",
        cursor: loading ? "wait" : "pointer",
        border: highlight ? "none" : "1.5px solid rgba(255,255,255,0.15)",
        background: highlight ? "linear-gradient(135deg,#16a34a,#0d9488)" : "rgba(255,255,255,0.06)",
        color: "white", transition: "opacity 0.15s, transform 0.15s",
        boxShadow: highlight ? "0 4px 18px rgba(22,163,74,0.4)" : "none",
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      {loading ? "Loading…" : cta}
    </button>
  );
}

// ─── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: <BarChart3 size={22} />, color: "#16a34a", bg: "rgba(22,163,74,0.12)", title: "Real-time Dashboard", desc: "Visualise Scope 1, 2 & 3 emissions with live charts, year-on-year trends and drill-down breakdowns." },
  { icon: <Zap size={22} />, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", title: "Automated Calculations", desc: "Enter activity data once. Our GHG Protocol-aligned engine converts it to CO₂e instantly — no spreadsheets." },
  { icon: <FileText size={22} />, color: "#3b82f6", bg: "rgba(59,130,246,0.12)", title: "Audit-ready Reports", desc: "Generate investor-grade PDF and CSV reports with full audit trails in minutes, not weeks." },
  { icon: <TrendingDown size={22} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", title: "Decarbonisation Targets", desc: "Set science-based targets and track progress against your baseline year with automatic forecasting." },
  { icon: <Globe2 size={22} />, color: "#0d9488", bg: "rgba(13,148,136,0.12)", title: "All Three Scopes", desc: "Capture direct emissions, purchased energy and full value-chain activities across your organisation." },
  { icon: <ShieldCheck size={22} />, color: "#ef4444", bg: "rgba(239,68,68,0.12)", title: "Enterprise Security", desc: "SOC 2-aligned, SSO/SAML, role-based access and GHG audit logs keep your data safe and compliant." },
];


const TESTIMONIALS = [
  { quote: "Carbonly cut our annual GHG reporting from 6 weeks to 2 days. The audit trail alone is worth the subscription.", name: "Sarah Mitchell", role: "Head of Sustainability", company: "Forrest Group", initials: "SM", color: "#16a34a" },
  { quote: "We finally have a single source of truth for our Scope 3 data. The dashboard makes it easy for the whole leadership team to stay aligned.", name: "James Okafor", role: "CFO", company: "Novus Energy", initials: "JO", color: "#0d9488" },
  { quote: "From first login to our first published report took less than a week. The onboarding is genuinely smooth.", name: "Priya Sharma", role: "ESG Manager", company: "Meridian Logistics", initials: "PS", color: "#8b5cf6" },
];

const STATS = [
  { value: "2,500+", label: "Organisations tracked" },
  { value: "1.2 M t", label: "CO₂e measured annually" },
  { value: "94%", label: "Reduction in reporting time" },
  { value: "ISO 14064", label: "Aligned standard" },
];

const LOGOS = [
  { label: "Manufacturing", icon: <Factory size={16} /> },
  { label: "Logistics", icon: <Truck size={16} /> },
  { label: "Real Estate", icon: <Building2 size={16} /> },
  { label: "Financial Services", icon: <ShieldCheck size={16} /> },
  { label: "Energy & Utilities", icon: <Zap size={16} /> },
  { label: "Professional Services", icon: <Users size={16} /> },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: "#030d05", minHeight: "100vh", color: "white", overflowX: "hidden" }}>
      <AnimationStyles />
      <LandingNav />

      {/* ─── Hero ─── */}
      <section style={{ position: "relative", paddingTop: 148, paddingBottom: 100, textAlign: "center" }}>
        {/* Animated gradient blobs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
            width: 800, height: 600,
            background: "radial-gradient(ellipse at center, rgba(22,163,74,0.18) 0%, transparent 70%)",
            animation: "blob-drift 12s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", top: 200, right: -100,
            width: 500, height: 500,
            background: "radial-gradient(ellipse at center, rgba(13,148,136,0.12) 0%, transparent 70%)",
            animation: "blob-drift 9s ease-in-out 2s infinite",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: -80,
            width: 400, height: 400,
            background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)",
            animation: "blob-drift 14s ease-in-out 4s infinite",
          }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "0 28px" }}>
          {/* Badge — fadeIn */}
          <div style={{
            animation: "fadeIn 0.7s ease both",
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px", borderRadius: 100,
            background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.3)",
            marginBottom: 28,
          }}>
            <Leaf size={13} color="#4ade80" style={{ animation: "spin-slow 8s linear infinite" }} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#4ade80" }}>
              GHG Protocol aligned · ISO 14064
            </span>
          </div>

          {/* Headline — staggered fadeUp */}
          <div style={{ animation: "fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) 0.1s both" }}>
            <h1 style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, lineHeight: 1.1,
              letterSpacing: "-0.03em", margin: "0 0 8px", color: "white",
            }}>
              Carbon accounting for
            </h1>
            <h1 style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, lineHeight: 1.1,
              letterSpacing: "-0.03em", margin: "0 0 24px",
              background: "linear-gradient(135deg,#4ade80,#2dd4bf)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              minHeight: "1.15em",
            }}>
              <TypewriterBadge texts={["action.", "net zero.", "your team.", "the planet."]} />
            </h1>
          </div>

          <div style={{ animation: "fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) 0.2s both" }}>
            <p style={{
              fontSize: "1.1875rem", lineHeight: 1.65,
              color: "rgba(255,255,255,0.6)", maxWidth: 600, margin: "0 auto 40px",
            }}>
              Measure, track and report Scope 1, 2 &amp; 3 emissions with confidence.
              Carbonly turns raw activity data into audit-ready GHG reports — automatically.
            </p>
          </div>

          <div style={{ animation: "fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) 0.3s both", display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 10,
              background: "linear-gradient(135deg,#16a34a,#0d9488)",
              color: "white", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
              boxShadow: "0 4px 24px rgba(22,163,74,0.45)",
              transition: "opacity 0.14s, transform 0.14s",
              animation: "pulse-glow 3s ease-in-out 1.5s infinite",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              Start free trial <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "1rem", textDecoration: "none",
              transition: "border-color 0.14s, color 0.14s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
            >
              See how it works
            </a>
          </div>

          <div style={{ animation: "fadeIn 1s ease 0.5s both" }}>
            <p style={{ marginTop: 20, fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>
              14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>

        {/* ── Floating dashboard preview ── */}
        <Float duration={5} delay={0} style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "64px auto 0", padding: "0 28px" }}>
          <div style={{
            animation: "scaleIn 0.9s cubic-bezier(0.22,1,0.36,1) 0.45s both",
          }}>
            <div style={{
              borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
              background: "linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            }}>
              {/* Browser chrome */}
              <div style={{
                height: 40, background: "rgba(255,255,255,0.04)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", gap: 7, padding: "0 16px",
              }}>
                {["#ef4444","#f59e0b","#22c55e"].map((c) => (
                  <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.7 }} />
                ))}
                <div style={{
                  marginLeft: 8, height: 22, flex: 1, maxWidth: 340,
                  background: "rgba(255,255,255,0.07)", borderRadius: 5,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", color: "rgba(255,255,255,0.3)",
                }}>
                  app.carbonly.io/dashboard
                </div>
              </div>
              {/* Dashboard mockup */}
              <div style={{ padding: "24px", minHeight: 340, display: "flex", gap: 20 }}>
                <div style={{ width: 48, display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: i === 0 ? "rgba(22,163,74,0.25)" : "rgba(255,255,255,0.05)",
                      animation: `fadeIn 0.4s ease ${0.6 + i * 0.07}s both`,
                    }} />
                  ))}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    borderRadius: 12, padding: "20px 24px",
                    background: "linear-gradient(135deg,#052e16,#064e3b,#134e4a)",
                    border: "1px solid rgba(74,222,128,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    animation: "fadeUp 0.5s ease 0.7s both",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(134,239,172,0.7)", marginBottom: 4 }}>TOTAL EMISSIONS 2025</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", lineHeight: 1 }}>1,248 t CO₂e</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        {["↓ 12% YoY","↓ 31% vs baseline"].map((t, i) => (
                          <div key={t} style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: 100, background: "rgba(74,222,128,0.15)", color: "#4ade80", animation: `fadeIn 0.4s ease ${0.9 + i * 0.1}s both` }}>{t}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
                      {[0.6,0.75,0.65,0.8,0.7,0.85,0.78,0.68,0.9,0.72,0.6,0.55].map((h, i) => (
                        <div key={i} style={{
                          width: 6, borderRadius: 3, height: `${h * 100}%`,
                          background: `rgba(134,239,172,${0.3 + h * 0.4})`,
                          animation: `fadeUp 0.3s ease ${0.8 + i * 0.04}s both`,
                        }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Scope 1", value: "342 t", color: "#4ade80", pct: 27 },
                      { label: "Scope 2", value: "518 t", color: "#2dd4bf", pct: 42 },
                      { label: "Scope 3", value: "388 t", color: "#a78bfa", pct: 31 },
                    ].map((s, i) => (
                      <div key={s.label} style={{
                        borderRadius: 10, padding: "14px 16px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                        animation: `fadeUp 0.4s ease ${0.85 + i * 0.1}s both`,
                      }}>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "white" }}>{s.value}</div>
                        <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                          <div style={{
                            height: "100%", borderRadius: 4, background: s.color,
                            width: `${s.pct}%`,
                            animation: `bar-grow 0.8s cubic-bezier(0.22,1,0.36,1) ${1.1 + i * 0.1}s both`,
                            transformOrigin: "left",
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    borderRadius: 10, padding: "14px 16px", flex: 1,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "flex-end", gap: 4, minHeight: 80,
                    animation: "fadeUp 0.4s ease 1.1s both",
                  }}>
                    {[0.4,0.55,0.5,0.7,0.6,0.75,0.65,0.8,0.7,0.9,0.75,0.65].map((h, i) => (
                      <div key={i} style={{
                        flex: 1, borderRadius: "3px 3px 0 0", height: `${h * 100}%`,
                        background: `rgba(22,163,74,${0.2 + h * 0.35})`,
                        animation: `fadeUp 0.3s ease ${1.2 + i * 0.04}s both`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under preview */}
          <div style={{
            position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)",
            width: "70%", height: 60,
            background: "radial-gradient(ellipse at center, rgba(22,163,74,0.25) 0%, transparent 70%)",
            filter: "blur(20px)", pointerEvents: "none",
          }} />
        </Float>
      </section>

      {/* ─── Trusted by ─── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 28px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal animation="fadeIn">
            <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)", marginBottom: 20, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Trusted by teams across
            </p>
          </Reveal>
          <Stagger
            animation="fadeUp"
            stagger={60}
            delay={100}
            style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
          >
            {LOGOS.map((l) => (
              <div key={l.label} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "7px 16px", borderRadius: 100,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.45)", fontSize: "0.8125rem", fontWeight: 500,
                transition: "border-color 0.2s, color 0.2s, background 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(22,163,74,0.4)"; (e.currentTarget as HTMLElement).style.color = "#4ade80"; (e.currentTarget as HTMLElement).style.background = "rgba(22,163,74,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              >
                {l.icon} {l.label}
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section style={{ padding: "80px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal animation="scaleIn">
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4,1fr)",
              borderRadius: 16, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.03)",
            }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{
                  padding: "36px 28px", textAlign: "center",
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  transition: "background 0.2s",
                }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(22,163,74,0.05)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{
                    fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em",
                    background: "linear-gradient(135deg,#4ade80,#2dd4bf)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    <CountUp value={s.value} />
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", marginTop: 6, fontWeight: 500 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" style={{ padding: "0 28px 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal animation="fadeUp" style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 100,
              background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", marginBottom: 16,
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80", letterSpacing: "0.05em", textTransform: "uppercase" }}>Features</span>
            </div>
            <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "white" }}>
              Everything you need to<br />
              <span style={{ background: "linear-gradient(135deg,#4ade80,#2dd4bf)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                reach net zero
              </span>
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto" }}>
              One platform to measure every emission, hit every target, and satisfy every auditor.
            </p>
          </Reveal>

          <Stagger
            animation="fadeUp"
            stagger={70}
            delay={0}
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}
          >
            {FEATURES.map((f) => (
              <GlowCard key={f.title} style={{
                padding: "28px", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                cursor: "default",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: f.bg, color: f.color,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                  transition: "transform 0.2s",
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </GlowCard>
            ))}
          </Stagger>
        </div>
      </section>

      <HowItWorks />

      {/* ─── Pricing ─── */}
      <section id="pricing" style={{ padding: "100px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal animation="fadeUp" style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 100,
              background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", marginBottom: 16,
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80", letterSpacing: "0.05em", textTransform: "uppercase" }}>Pricing</span>
            </div>
            <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "white" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.5)", maxWidth: 460, margin: "0 auto" }}>
              Start free for 14 days. No credit card required. Upgrade when you&apos;re ready.
            </p>
          </Reveal>

          <Stagger
            animation="fadeUp"
            stagger={100}
            delay={0}
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }}
          >
            {PLANS.map((plan) => (
              <GlowCard key={plan.key} active={plan.highlight} style={{
                borderRadius: 18,
                border: plan.highlight ? "1.5px solid rgba(22,163,74,0.4)" : "1px solid rgba(255,255,255,0.08)",
                background: plan.highlight
                  ? "linear-gradient(180deg,rgba(22,163,74,0.08) 0%,rgba(13,148,136,0.05) 100%)"
                  : "rgba(255,255,255,0.03)",
                padding: "32px 28px",
                position: "relative", overflow: "hidden",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
                    width: 200, height: 120,
                    background: "radial-gradient(ellipse,rgba(22,163,74,0.25),transparent 70%)",
                    pointerEvents: "none",
                    animation: "pulse-glow 3s ease-in-out infinite",
                  }} />
                )}
                {plan.badge && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 100, marginBottom: 16,
                    background: "linear-gradient(135deg,rgba(22,163,74,0.3),rgba(13,148,136,0.3))",
                    border: "1px solid rgba(22,163,74,0.4)",
                    fontSize: "0.72rem", fontWeight: 700, color: "#4ade80", letterSpacing: "0.04em",
                  }}>
                    <Star size={10} />
                    {plan.badge}
                  </div>
                )}
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", margin: "0 0 6px" }}>{plan.name}</h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)", margin: "0 0 24px", lineHeight: 1.5 }}>{plan.description}</p>
                <div style={{ marginBottom: 28 }}>
                  {plan.monthlyPrice !== null ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{plan.currency}</span>
                      <span style={{
                        fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.03em",
                        background: plan.highlight ? "linear-gradient(135deg,#4ade80,#2dd4bf)" : "white",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      }}>{plan.monthlyPrice}</span>
                      <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>/month</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em", color: "white" }}>Custom</div>
                  )}
                  {plan.annualPrice && (
                    <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                      {plan.currency}{plan.annualPrice}/mo billed annually
                    </p>
                  )}
                  {plan.trial && (
                    <p style={{ fontSize: "0.8rem", color: "#4ade80", margin: "4px 0 0", fontWeight: 600 }}>✦ {plan.trial}</p>
                  )}
                </div>
                <PricingCTA planKey={plan.key} cta={plan.cta} highlight={plan.highlight} />
                <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 11 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: plan.highlight ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.07)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: plan.highlight ? "#4ade80" : "rgba(255,255,255,0.4)",
                      }}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </GlowCard>
            ))}
          </Stagger>

          <Reveal animation="fadeIn" delay={200}>
            <p style={{ textAlign: "center", marginTop: 28, fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)" }}>
              All prices excluding VAT. Annual billing saves up to 20%.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section style={{
        padding: "100px 28px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal animation="fadeUp" style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "white" }}>
              Loved by sustainability teams
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.5)" }}>
              Don&apos;t just take our word for it.
            </p>
          </Reveal>

          <Stagger
            animation="fadeUp"
            stagger={100}
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}
          >
            {TESTIMONIALS.map((t) => (
              <GlowCard key={t.name} style={{
                padding: "28px", borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                display: "flex", flexDirection: "column", gap: 20,
              }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, margin: 0, flex: 1 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: `linear-gradient(135deg,${t.color}44,${t.color}22)`,
                    border: `1.5px solid ${t.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 800, color: t.color,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "white" }}>{t.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>{t.role}, {t.company}</div>
                  </div>
                </div>
              </GlowCard>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section style={{ padding: "100px 28px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Reveal animation="scaleIn">
            <div style={{
              borderRadius: 24, padding: "64px 56px", textAlign: "center",
              background: "linear-gradient(135deg,#052e16 0%,#064e3b 60%,#134e4a 100%)",
              border: "1px solid rgba(74,222,128,0.2)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -40, right: -40, width: 220, height: 220,
                background: "radial-gradient(ellipse,rgba(22,163,74,0.2),transparent 70%)",
                pointerEvents: "none", animation: "blob-drift 8s ease-in-out infinite",
              }} />
              <div style={{
                position: "absolute", bottom: -40, left: -40, width: 220, height: 220,
                background: "radial-gradient(ellipse,rgba(13,148,136,0.15),transparent 70%)",
                pointerEvents: "none", animation: "blob-drift 10s ease-in-out 2s infinite",
              }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "white" }}>
                  Start measuring your impact today
                </h2>
                <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.6)", maxWidth: 480, margin: "0 auto 36px" }}>
                  Join hundreds of organisations already using Carbonly to track, report and reduce their carbon footprint.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <Link href="/register" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "14px 28px", borderRadius: 10,
                    background: "linear-gradient(135deg,#16a34a,#0d9488)",
                    color: "white", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
                    boxShadow: "0 4px 24px rgba(22,163,74,0.4)", transition: "opacity 0.14s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
                  >
                    Get started free <ChevronRight size={16} />
                  </Link>
                  <Link href="/login" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "14px 28px", borderRadius: 10,
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "1rem", textDecoration: "none",
                    transition: "border-color 0.14s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.4)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"}
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "48px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap", marginBottom: 40 }}>
            <Reveal animation="fadeUp">
              <div style={{ maxWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "linear-gradient(135deg,#16a34a,#0d9488)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 10px rgba(22,163,74,0.35)",
                    animation: "pulse-glow 3s ease-in-out infinite",
                  }}>
                    <Leaf size={14} color="white" />
                  </div>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Carbonly</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, margin: 0 }}>
                  GHG accounting software for organisations serious about decarbonisation.
                </p>
              </div>
            </Reveal>

            {[
              { heading: "Product", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "How it works", href: "#how-it-works" }] },
              { heading: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }] },
              { heading: "Legal", links: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Cookie Policy", href: "#" }] },
            ].map((col, i) => (
              <Reveal key={col.heading} animation="fadeUp" delay={i * 80}>
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                    {col.heading}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {col.links.map((l) => (
                      <a key={l.label} href={l.href} style={{
                        fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.12s",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
          }}>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)", margin: 0 }}>
              © {new Date().getFullYear()} Carbonly. All rights reserved.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)", margin: 0 }}>
              Built with ♥ for a sustainable future
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
