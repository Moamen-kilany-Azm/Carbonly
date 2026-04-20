"use client";

import { useState } from "react";
import { formatCO2e } from "@/lib/utils/format";
import { Flame, Zap, Globe, ChevronDown, ChevronUp, X, TrendingDown, TrendingUp } from "lucide-react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";

type Activity = { name: string; co2eT: number };

type ScopeData = {
  scope: 1 | 2 | 3;
  label: string;
  value: number;
  prevValue?: number;
  activities: Activity[];
};

type Props = {
  totalCo2eT: number;
  scopes: ScopeData[];
};

const CFG = {
  1: {
    icon: <Flame size={20} />,
    sub: "Direct Emissions",
    accent: "#16a34a",
    accentLight: "rgba(22,163,74,0.1)",
    accentMid: "rgba(22,163,74,0.18)",
    bar: "#22c55e",
    activeBorder: "#16a34a",
    activeShadow: "0 8px 24px rgba(22,163,74,0.18)",
    bgActive: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    bg: "#ffffff",
  },
  2: {
    icon: <Zap size={20} />,
    sub: "Purchased Energy",
    accent: "#2563eb",
    accentLight: "rgba(37,99,235,0.08)",
    accentMid: "rgba(37,99,235,0.16)",
    bar: "#3b82f6",
    activeBorder: "#2563eb",
    activeShadow: "0 8px 24px rgba(37,99,235,0.15)",
    bgActive: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    bg: "#ffffff",
  },
  3: {
    icon: <Globe size={20} />,
    sub: "Value Chain",
    accent: "#d97706",
    accentLight: "rgba(217,119,6,0.08)",
    accentMid: "rgba(217,119,6,0.16)",
    bar: "#f59e0b",
    activeBorder: "#d97706",
    activeShadow: "0 8px 24px rgba(217,119,6,0.15)",
    bgActive: "linear-gradient(135deg, #fffbeb, #fef3c7)",
    bg: "#ffffff",
  },
};

export function ScopeCards({ totalCo2eT, scopes }: Props) {
  const [active, setActive] = useState<1 | 2 | 3 | null>(null);
  const toggle = (s: 1 | 2 | 3) => setActive((p) => (p === s ? null : s));

  const activeScope = scopes.find((s) => s.scope === active);
  const c = active ? CFG[active] : null;

  return (
    <Box sx={{ mb: "20px" }}>
      {/* Three scope cards — Bootstrap row */}
      <div className="row g-3">
        {scopes.map(({ scope, label, value, prevValue }) => {
          const cfg = CFG[scope];
          const isActive = active === scope;
          const pct = totalCo2eT > 0 ? (value / totalCo2eT) * 100 : 0;
          const yoy = prevValue && prevValue > 0
            ? ((value - prevValue) / prevValue) * 100
            : null;
          const improved = yoy !== null && yoy < 0;
          const worsened = yoy !== null && yoy > 0;

          return (
            <div key={scope} className="col-md-4">
              <Card
                component="button"
                onClick={() => toggle(scope)}
                sx={{
                  background: isActive ? cfg.bgActive : cfg.bg,
                  border: isActive ? `2px solid ${cfg.activeBorder}` : "1px solid #e2e8f0",
                  borderRadius: "16px",
                  p: "20px 22px",
                  cursor: "pointer",
                  textAlign: "left",
                  outline: "none",
                  boxShadow: isActive ? cfg.activeShadow : "0 1px 3px rgba(0,0,0,0.06)",
                  transform: isActive ? "translateY(-2px)" : "none",
                  transition: "all 0.16s ease",
                  width: "100%",
                }}
              >
                {/* Icon + label row */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Box sx={{
                      width: 38, height: 38, borderRadius: "10px",
                      background: isActive ? cfg.accentMid : cfg.accentLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: cfg.accent,
                      transition: "background 0.16s ease",
                    }}>
                      {cfg.icon}
                    </Box>
                    <Box>
                      <Typography sx={{
                        fontSize: "0.875rem", fontWeight: 700,
                        color: isActive ? cfg.accent : "#0f172a",
                        transition: "color 0.16s ease",
                      }}>
                        {label}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
                        {cfg.sub}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{
                    width: 24, height: 24, borderRadius: "6px",
                    bgcolor: isActive ? cfg.accentLight : "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isActive ? cfg.accent : "#94a3b8",
                    transition: "all 0.16s ease",
                    flexShrink: 0,
                  }}>
                    {isActive ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </Box>
                </Box>

                {/* Value */}
                <Box sx={{ mb: "14px" }}>
                  <Typography component="span" sx={{
                    fontSize: "2rem", fontWeight: 900,
                    color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1,
                  }}>
                    {formatCO2e(value)}
                  </Typography>
                  <Typography component="span" sx={{
                    fontSize: "0.8rem", fontWeight: 500,
                    color: "#94a3b8", ml: "5px",
                  }}>
                    tCO&#x2082;e
                  </Typography>
                </Box>

                {/* Progress bar */}
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 5, borderRadius: 99, mb: "10px",
                    bgcolor: "#f1f5f9",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: cfg.bar,
                      borderRadius: 99,
                      opacity: isActive ? 1 : 0.7,
                      transition: "width 0.4s ease",
                    },
                  }}
                />

                {/* Footer: % of total + YoY */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: cfg.accent }}>
                    {pct.toFixed(1)}% of total
                  </Typography>

                  {yoy !== null && (
                    <Chip
                      icon={improved ? <TrendingDown size={10} /> : worsened ? <TrendingUp size={10} /> : undefined}
                      label={`${improved ? "" : "+"}${yoy.toFixed(1)}% YoY`}
                      size="small"
                      sx={{
                        fontSize: "0.75rem", fontWeight: 700, height: 22,
                        color: improved ? "#16a34a" : worsened ? "#dc2626" : "#94a3b8",
                        bgcolor: improved ? "rgba(22,163,74,0.1)" : worsened ? "rgba(220,38,38,0.08)" : "#f1f5f9",
                        "& .MuiChip-icon": { color: "inherit" },
                      }}
                    />
                  )}
                </Box>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Drill-down panel */}
      {active && activeScope && c && (
        <Card
          sx={{
            mt: "10px",
            border: `1.5px solid ${c.activeBorder}`,
            borderTop: `3px solid ${c.activeBorder}`,
            borderRadius: "0 0 16px 16px",
            p: "20px 24px",
            boxShadow: c.activeShadow,
            animation: "scopeSlide 0.18s ease",
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "18px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: "8px",
                bgcolor: c.accentLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: c.accent,
              }}>
                {CFG[active].icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                  {activeScope.label} &middot; Activity Breakdown
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  {activeScope.activities.length} {activeScope.activities.length === 1 ? "activity" : "activities"} &middot; {formatCO2e(activeScope.value)} tCO&#x2082;e
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setActive(null)}
              size="small"
              sx={{
                border: "1px solid #e2e8f0", bgcolor: "#f8fafc",
                color: "#94a3b8", width: 28, height: 28,
              }}
            >
              <X size={13} />
            </IconButton>
          </Box>

          {activeScope.activities.length === 0 ? (
            <Typography sx={{ textAlign: "center", color: "#94a3b8", fontSize: "0.875rem", py: "20px" }}>
              No activity data yet.
            </Typography>
          ) : (
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "10px",
            }}>
              {activeScope.activities.map((a, i) => {
                const max = activeScope.activities[0].co2eT;
                const barPct = max > 0 ? (a.co2eT / max) * 100 : 0;
                const shareOfScope = activeScope.value > 0 ? (a.co2eT / activeScope.value) * 100 : 0;
                const isTop = i === 0;

                return (
                  <Box key={a.name} sx={{
                    p: "13px 15px",
                    bgcolor: isTop ? c.accentLight : "#f8fafc",
                    border: `1px solid ${isTop ? c.activeBorder + "40" : "#f1f5f9"}`,
                    borderRadius: "11px",
                  }}>
                    {/* Name row */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                        <Box sx={{
                          width: 20, height: 20, borderRadius: "50%",
                          bgcolor: isTop ? c.bar : "#e2e8f0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.6rem", fontWeight: 800,
                          color: isTop ? "white" : "#94a3b8",
                          flexShrink: 0,
                        }}>
                          {i + 1}
                        </Box>
                        <Typography sx={{
                          fontSize: "0.8125rem", fontWeight: 600, color: "#0f172a",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {a.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${shareOfScope.toFixed(1)}%`}
                        size="small"
                        sx={{
                          fontSize: "0.7rem", fontWeight: 700, height: 20,
                          color: c.accent, bgcolor: c.accentLight,
                          flexShrink: 0,
                        }}
                      />
                    </Box>

                    {/* Bar */}
                    <LinearProgress
                      variant="determinate"
                      value={barPct}
                      sx={{
                        height: 4, borderRadius: 99, mb: 1,
                        bgcolor: "#e2e8f0",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: c.bar, borderRadius: 99, opacity: 0.8,
                        },
                      }}
                    />

                    {/* Value */}
                    <Typography sx={{ fontSize: "0.9375rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                      {formatCO2e(a.co2eT)}
                      <Typography component="span" sx={{ fontSize: "0.7rem", fontWeight: 400, color: "#94a3b8", ml: "3px" }}>
                        tCO&#x2082;e
                      </Typography>
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>
      )}

      <style>{`
        @keyframes scopeSlide {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}
