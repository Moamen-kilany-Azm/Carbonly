"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, BarChart3, FileText, Check, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/landing/animations";

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: Upload,
    accent: "#4ade80",
    accentDim: "rgba(74,222,128,0.15)",
    accentBorder: "rgba(74,222,128,0.3)",
    title: "Connect your data",
    subtitle: "Import in minutes",
    desc: "Upload a CSV or enter activity data directly. Carbonly automatically maps each row to the correct emission factor — no manual lookup required.",
    bullets: ["CSV & spreadsheet import", "Manual data entry", "Auto emission factor mapping"],
  },
  {
    number: "02",
    icon: BarChart3,
    accent: "#2dd4bf",
    accentDim: "rgba(45,212,191,0.15)",
    accentBorder: "rgba(45,212,191,0.3)",
    title: "Track every scope",
    subtitle: "Live calculations",
    desc: "Our GHG Protocol engine instantly calculates Scope 1, 2 and 3 CO₂e. Watch your dashboard update in real time as you add data.",
    bullets: ["Scope 1, 2 & 3 coverage", "Year-on-year comparisons", "Drill-down by activity"],
  },
  {
    number: "03",
    icon: FileText,
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.15)",
    accentBorder: "rgba(167,139,250,0.3)",
    title: "Report with confidence",
    subtitle: "One-click exports",
    desc: "Generate audit-ready GHG reports for investors, boards or regulators. Export PDF or CSV instantly, with full audit trails baked in.",
    bullets: ["PDF & CSV export", "Full audit trail", "Investor-ready format"],
  },
];

const STEP_DURATION = 4500; // ms before auto-advance

// ─── Step 1 mockup: data import UI ───────────────────────────────────────────

function MockImport({ active }: { active: boolean }) {
  const rows = [
    { activity: "Natural gas boiler", unit: "kWh", qty: "12,400", factor: "0.203", co2e: "2.52 t" },
    { activity: "Company vehicles", unit: "L diesel", qty: "3,180", factor: "2.680", co2e: "8.52 t" },
    { activity: "Electricity (Grid)", unit: "kWh", qty: "48,000", factor: "0.233", co2e: "11.2 t" },
    { activity: "Business flights", unit: "km", qty: "24,600", factor: "0.158", co2e: "3.89 t" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {/* Upload zone */}
      <div style={{
        border: `2px dashed ${active ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 12, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 14,
        background: active ? "rgba(74,222,128,0.04)" : "transparent",
        transition: "all 0.5s ease",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: active ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: active ? "#4ade80" : "rgba(255,255,255,0.3)",
          transition: "all 0.4s ease", flexShrink: 0,
        }}>
          <Upload size={16} />
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", transition: "color 0.4s" }}>
            emissions_2025.csv
          </div>
          <div style={{ fontSize: "0.7rem", color: active ? "#4ade80" : "rgba(255,255,255,0.25)", transition: "color 0.4s", marginTop: 2 }}>
            {active ? "4 activities detected · ready to import" : "Drop file or click to upload"}
          </div>
        </div>
        {active && (
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 100,
            background: "rgba(74,222,128,0.15)", color: "#4ade80",
            fontSize: "0.7rem", fontWeight: 700,
            animation: "fadeIn 0.4s ease both",
          }}>
            <Check size={11} strokeWidth={3} /> Mapped
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{
        flex: 1, overflow: "hidden", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
          padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          {["Activity", "Unit", "Quantity", "Factor", "CO₂e"].map(h => <div key={h}>{h}</div>)}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            padding: "9px 14px",
            borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            fontSize: "0.72rem",
            opacity: active ? 1 : 0.4,
            transition: `opacity 0.4s ease ${i * 0.08}s`,
            background: active && i === 0 ? "rgba(74,222,128,0.04)" : "transparent",
          }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{r.activity}</div>
            <div style={{ color: "rgba(255,255,255,0.4)" }}>{r.unit}</div>
            <div style={{ color: "rgba(255,255,255,0.6)" }}>{r.qty}</div>
            <div style={{ color: "rgba(255,255,255,0.4)" }}>{r.factor}</div>
            <div style={{ color: "#4ade80", fontWeight: 700 }}>{r.co2e}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2 mockup: live dashboard ───────────────────────────────────────────

function MockDashboard({ active }: { active: boolean }) {
  const scopes = [
    { label: "Scope 1", value: "342 t", pct: 27, color: "#4ade80" },
    { label: "Scope 2", value: "518 t", pct: 42, color: "#2dd4bf" },
    { label: "Scope 3", value: "388 t", pct: 31, color: "#a78bfa" },
  ];
  const bars = [0.42, 0.58, 0.51, 0.73, 0.64, 0.79, 0.68, 0.82, 0.71, 0.91, 0.77, 0.65];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {/* Hero stat */}
      <div style={{
        borderRadius: 12, padding: "16px 20px",
        background: "linear-gradient(135deg,#052e16,#064e3b,#134e4a)",
        border: `1px solid ${active ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.06)"}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "border-color 0.5s",
      }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "rgba(134,239,172,0.6)", marginBottom: 4, letterSpacing: "0.05em" }}>TOTAL EMISSIONS 2025</div>
          <div style={{
            fontSize: "1.75rem", fontWeight: 900, color: "white", lineHeight: 1,
            opacity: active ? 1 : 0.5, transition: "opacity 0.5s",
          }}>
            1,248 t CO₂e
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
            {["↓ 12% YoY", "↓ 31% vs 2021"].map((t, i) => (
              <div key={t} style={{
                fontSize: "0.62rem", padding: "2px 7px", borderRadius: 100,
                background: "rgba(74,222,128,0.15)", color: "#4ade80",
                opacity: active ? 1 : 0,
                transition: `opacity 0.4s ease ${0.2 + i * 0.1}s`,
              }}>{t}</div>
            ))}
          </div>
        </div>
        {/* Sparkline */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: 5, borderRadius: 3,
              background: `rgba(134,239,172,${0.25 + h * 0.45})`,
              height: active ? `${h * 100}%` : "10%",
              transition: `height 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s`,
            }} />
          ))}
        </div>
      </div>

      {/* Scope cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {scopes.map((s, i) => (
          <div key={s.label} style={{
            borderRadius: 10, padding: "12px 14px",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
            transition: "border-color 0.4s",
          }}>
            <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "white", opacity: active ? 1 : 0.4, transition: "opacity 0.5s" }}>{s.value}</div>
            <div style={{ marginTop: 7, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.07)" }}>
              <div style={{
                height: "100%", borderRadius: 3, background: s.color,
                width: active ? `${s.pct}%` : "0%",
                transition: `width 0.8s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.1}s`,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        flex: 1, borderRadius: 10, padding: "12px 14px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em" }}>MONTHLY TREND</div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 3 }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: "3px 3px 0 0",
              background: `rgba(45,212,191,${0.2 + h * 0.4})`,
              height: active ? `${h * 100}%` : "5%",
              transition: `height 0.6s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.04}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 mockup: report preview ───────────────────────────────────────────

function MockReport({ active }: { active: boolean }) {
  const items = [
    { scope: "Scope 1 — Direct", value: "342.1 tCO₂e", share: "27%", color: "#4ade80" },
    { scope: "Scope 2 — Energy",  value: "518.4 tCO₂e", share: "42%", color: "#2dd4bf" },
    { scope: "Scope 3 — Value chain", value: "387.9 tCO₂e", share: "31%", color: "#a78bfa" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {/* Report header */}
      <div style={{
        borderRadius: 12, padding: "16px 20px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginBottom: 4 }}>GHG EMISSIONS REPORT</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "white", opacity: active ? 1 : 0.5, transition: "opacity 0.5s" }}>
            Annual Report 2025
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Acme Corp · ISO 14064 aligned</div>
        </div>
        <div style={{
          display: "flex", gap: 7,
          opacity: active ? 1 : 0.2,
          transition: "opacity 0.5s",
        }}>
          {[
            { label: "PDF", color: "#ef4444" },
            { label: "CSV", color: "#16a34a" },
          ].map((b) => (
            <div key={b.label} style={{
              padding: "5px 11px", borderRadius: 7,
              background: `${b.color}22`, border: `1px solid ${b.color}44`,
              fontSize: "0.7rem", fontWeight: 700, color: b.color,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <FileText size={10} /> {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Scope breakdown */}
      <div style={{
        flex: 1, borderRadius: 12, padding: "16px 20px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.06em" }}>SCOPE BREAKDOWN</div>
        {items.map((item, i) => (
          <div key={item.scope} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{item.scope}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{item.share}</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`,
                width: active ? item.share : "0%",
                transition: `width 0.9s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.15}s`,
              }} />
            </div>
          </div>
        ))}

        {/* Audit trail */}
        <div style={{
          marginTop: 4, padding: "10px 12px", borderRadius: 8,
          background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)",
          display: "flex", alignItems: "center", gap: 8,
          opacity: active ? 1 : 0,
          transition: "opacity 0.5s 0.6s",
        }}>
          <Check size={13} color="#4ade80" strokeWidth={3} />
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>
            Audit trail verified · 48 records · last updated just now
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimers(currentStep: number) {
    if (progressRef.current) clearInterval(progressRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(0);
    const tickMs = 30;
    const ticks = STEP_DURATION / tickMs;
    let tick = 0;

    progressRef.current = setInterval(() => {
      tick++;
      setProgress((tick / ticks) * 100);
    }, tickMs);

    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length);
      setProgress(0);
      tick = 0;
    }, STEP_DURATION);
  }

  useEffect(() => {
    if (!paused) startTimers(active);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  function selectStep(i: number) {
    setActive(i);
    setProgress(0);
    setPaused(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    startTimers(i);
  }

  const step = STEPS[active];

  return (
    <section
      id="how-it-works"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); }}
      style={{
        padding: "100px 28px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.012)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <Reveal animation="fadeUp" style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 100,
            background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.25)",
            marginBottom: 16,
          }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2dd4bf", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              How it works
            </span>
          </div>
          <h2 style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "white" }}>
            Up and running in hours,<br />not months
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto" }}>
            No consultants. No lengthy implementation. Clean carbon data from day one.
          </p>
        </Reveal>

        {/* Split panel */}
        <Reveal animation="fadeUp" delay={100}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 48, alignItems: "center" }}>

            {/* ── Left: stepper ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === active;
                const isDone = i < active;

                return (
                  <div
                    key={s.number}
                    onClick={() => selectStep(i)}
                    style={{ display: "flex", gap: 20, cursor: "pointer", position: "relative", paddingBottom: i < STEPS.length - 1 ? 8 : 0 }}
                  >
                    {/* Vertical line */}
                    {i < STEPS.length - 1 && (
                      <div style={{
                        position: "absolute", left: 23, top: 56, bottom: 0,
                        width: 1,
                        background: isDone
                          ? "rgba(74,222,128,0.4)"
                          : "rgba(255,255,255,0.07)",
                        transition: "background 0.4s",
                      }} />
                    )}

                    {/* Icon circle */}
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${isActive ? s.accent : isDone ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.1)"}`,
                      background: isActive ? s.accentDim : isDone ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isActive ? s.accent : isDone ? "#4ade80" : "rgba(255,255,255,0.3)",
                      transition: "all 0.35s ease",
                      position: "relative", zIndex: 1,
                    }}>
                      {isDone
                        ? <Check size={16} strokeWidth={3} />
                        : <Icon size={16} />
                      }
                    </div>

                    {/* Text */}
                    <div style={{
                      flex: 1, paddingBottom: 28,
                      opacity: isActive ? 1 : 0.45,
                      transition: "opacity 0.35s ease",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em",
                          color: isActive ? s.accent : "rgba(255,255,255,0.3)",
                          transition: "color 0.35s",
                        }}>
                          STEP {s.number}
                        </span>
                        {isActive && (
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 600, padding: "1px 7px", borderRadius: 100,
                            background: s.accentDim, color: s.accent, border: `1px solid ${s.accentBorder}`,
                            animation: "fadeIn 0.3s ease both",
                          }}>
                            {s.subtitle}
                          </span>
                        )}
                      </div>

                      <h3 style={{
                        fontSize: "1.1rem", fontWeight: 800, color: "white", margin: "0 0 8px",
                        transition: "color 0.35s",
                      }}>
                        {s.title}
                      </h3>

                      {isActive && (
                        <div style={{ animation: "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", margin: "0 0 12px", lineHeight: 1.65 }}>
                            {s.desc}
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {s.bullets.map((b, bi) => (
                              <div key={b} style={{
                                display: "flex", alignItems: "center", gap: 8,
                                animation: `fadeUp 0.3s ease ${bi * 0.07}s both`,
                              }}>
                                <div style={{
                                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                                  background: s.accentDim, border: `1px solid ${s.accentBorder}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  color: s.accent,
                                }}>
                                  <Check size={9} strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>{b}</span>
                              </div>
                            ))}
                          </div>

                          {/* Progress bar */}
                          {!paused && (
                            <div style={{
                              marginTop: 16, height: 2, borderRadius: 2,
                              background: "rgba(255,255,255,0.07)", overflow: "hidden",
                            }}>
                              <div style={{
                                height: "100%", borderRadius: 2, background: s.accent,
                                width: `${progress}%`,
                                transition: "width 0.03s linear",
                              }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Next step hint */}
              <div style={{ paddingLeft: 68, marginTop: 4 }}>
                <a href="/register" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: "0.875rem", fontWeight: 700, color: "#4ade80",
                  textDecoration: "none", transition: "gap 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.gap = "10px"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.gap = "6px"}
                >
                  Start for free — no card needed <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* ── Right: animated mockup panel ── */}
            <div style={{ position: "relative" }}>
              {/* Glow behind panel */}
              <div style={{
                position: "absolute", inset: -20,
                background: `radial-gradient(ellipse at 50% 50%, ${step.accent}18 0%, transparent 70%)`,
                transition: "background 0.6s ease",
                pointerEvents: "none", zIndex: 0,
              }} />

              <div style={{
                position: "relative", zIndex: 1,
                borderRadius: 18,
                border: `1px solid ${step.accentBorder}`,
                background: "rgba(8,20,10,0.85)",
                backdropFilter: "blur(12px)",
                boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${step.accentBorder}`,
                overflow: "hidden",
                transition: "border-color 0.5s, box-shadow 0.5s",
              }}>
                {/* Panel chrome */}
                <div style={{
                  height: 44, borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 18px",
                  background: "rgba(255,255,255,0.03)",
                }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#ef4444","#f59e0b","#22c55e"].map((c) => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.65 }} />
                    ))}
                  </div>
                  <div style={{
                    fontSize: "0.7rem", color: step.accent, fontWeight: 600,
                    background: step.accentDim, padding: "3px 10px", borderRadius: 100,
                    border: `1px solid ${step.accentBorder}`,
                    transition: "all 0.4s",
                  }}>
                    {step.subtitle}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0,1,2].map((dot) => (
                      <div key={dot} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: dot === active ? step.accent : "rgba(255,255,255,0.12)",
                        transition: "background 0.35s",
                      }} />
                    ))}
                  </div>
                </div>

                {/* Panel body */}
                <div style={{ padding: "20px", minHeight: 360 }}>
                  <div key={active} style={{ animation: "fadeIn 0.35s ease both" }}>
                    {active === 0 && <MockImport active={true} />}
                    {active === 1 && <MockDashboard active={true} />}
                    {active === 2 && <MockReport active={true} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
