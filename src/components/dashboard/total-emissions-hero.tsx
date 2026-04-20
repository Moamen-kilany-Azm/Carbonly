"use client";

import { TrendingDown, TrendingUp, Minus, Leaf } from "lucide-react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

type MonthData = { month: number; total: number };

type ScopeChip = {
  scope: 1 | 2 | 3;
  label: string;
  sub: string;
  value: number;
  color: string;
};

type Props = {
  total: number;
  year: number;
  byMonth: MonthData[];
  prevYearTotal: number | null;
  baselineTotal: number | null;
  scopes: ScopeChip[];
};

const MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"];

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n >= 100 ? n.toFixed(1) : n.toFixed(2);
}

function Sparkline({ data }: { data: MonthData[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const BAR_W = 10;
  const GAP = 3;
  const H = 52;
  const totalW = 12 * (BAR_W + GAP) - GAP;

  return (
    <svg width={totalW} height={H} style={{ display: "block", overflow: "visible" }}>
      {data.map((d, i) => {
        const pct = d.total / max;
        const barH = Math.max(pct * H, 3);
        const x = i * (BAR_W + GAP);
        const y = H - barH;
        const opacity = 0.25 + pct * 0.65;
        return (
          <g key={i}>
            <rect
              x={x} y={y}
              width={BAR_W} height={barH}
              rx={3}
              fill={`rgba(134,239,172,${opacity})`}
            />
            {i % 3 === 0 && (
              <text
                x={x + BAR_W / 2} y={H + 13}
                textAnchor="middle"
                fontSize={8}
                fill="rgba(255,255,255,0.35)"
              >
                {MONTHS[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function TotalEmissionsHero({
  total, year, byMonth, prevYearTotal, baselineTotal, scopes,
}: Props) {
  const yoyPct = prevYearTotal && prevYearTotal > 0
    ? ((total - prevYearTotal) / prevYearTotal) * 100
    : null;

  const vsBaseline = baselineTotal && baselineTotal > 0 && year !== 2021
    ? ((total - baselineTotal) / baselineTotal) * 100
    : null;

  const isImproving = yoyPct !== null && yoyPct < 0;
  const isWorsening = yoyPct !== null && yoyPct > 0;

  return (
    <Card
      sx={{
        borderRadius: "20px",
        background: "linear-gradient(135deg, #052e16 0%, #064e3b 50%, #134e4a 100%)",
        p: "28px 32px",
        mb: "20px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(5,46,22,0.35), 0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* Decorative rings */}
      <Box sx={{
        position: "absolute", top: -60, right: -60,
        width: 280, height: 280, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.05)", pointerEvents: "none",
      }} />
      <Box sx={{
        position: "absolute", top: -30, right: -30,
        width: 160, height: 160, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.06)", pointerEvents: "none",
      }} />
      <Box sx={{
        position: "absolute", bottom: -80, left: "30%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top row: label + year badge */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "20px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{
            width: 28, height: 28, borderRadius: "8px",
            background: "rgba(74,222,128,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={14} color="#4ade80" />
          </Box>
          <Typography sx={{
            fontSize: "0.8125rem", fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Total Carbon Footprint
          </Typography>
        </Box>
        <Chip
          label={`FY ${year}${year === 2021 ? " \u00b7 Baseline" : year === 2026 ? " \u00b7 YTD" : ""}`}
          size="small"
          sx={{
            fontSize: "0.75rem", fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            bgcolor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            letterSpacing: "0.06em",
          }}
        />
      </Box>

      {/* Main content row */}
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 3 }}>
        {/* Left: big number block */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <Typography sx={{
              fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
              fontWeight: 900, color: "#ffffff",
              letterSpacing: "-0.04em", lineHeight: 1,
            }}>
              {fmt(total)}
            </Typography>
            <Typography sx={{
              fontSize: "1.125rem", fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.02em",
            }}>
              tCO&#x2082;e
            </Typography>
          </Box>

          {/* YoY + baseline badges */}
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: "14px" }}>
            {yoyPct !== null ? (
              <Chip
                icon={isImproving ? <TrendingDown size={13} /> : isWorsening ? <TrendingUp size={13} /> : <Minus size={13} />}
                label={`${isImproving ? "" : "+"}${yoyPct.toFixed(1)}% vs ${year - 1}`}
                size="small"
                sx={{
                  fontSize: "0.8125rem", fontWeight: 700,
                  bgcolor: isImproving ? "rgba(74,222,128,0.18)" : isWorsening ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${isImproving ? "rgba(74,222,128,0.35)" : isWorsening ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.12)"}`,
                  color: isImproving ? "#4ade80" : isWorsening ? "#f87171" : "rgba(255,255,255,0.55)",
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            ) : (
              <Chip
                label={year === 2021 ? "Baseline year" : "No prior-year data"}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "0.8rem", color: "rgba(255,255,255,0.4)",
                }}
              />
            )}

            {vsBaseline !== null && (
              <Chip
                label={`${vsBaseline < 0 ? "\u2193" : "\u2191"} ${Math.abs(vsBaseline).toFixed(1)}% vs baseline`}
                size="small"
                sx={{
                  fontSize: "0.8rem", fontWeight: 600,
                  bgcolor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)",
                }}
              />
            )}
          </Box>

          {/* Scope chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: "20px" }}>
            {scopes.map((s) => {
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <Box key={s.scope} sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  p: "7px 14px", borderRadius: "10px",
                  bgcolor: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: "50%",
                    bgcolor: s.color, flexShrink: 0,
                    boxShadow: `0 0 6px ${s.color}80`,
                  }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                    {s.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
                    {fmt(s.value)}
                  </Typography>
                  <Chip
                    label={`${pct.toFixed(0)}%`}
                    size="small"
                    sx={{
                      fontSize: "0.7rem", fontWeight: 600, height: 20, minWidth: 0,
                      color: "rgba(255,255,255,0.3)",
                      bgcolor: "rgba(255,255,255,0.06)",
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Right: sparkline */}
        <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
          <Typography sx={{
            fontSize: "0.7rem", fontWeight: 600,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Monthly trend
          </Typography>
          <Sparkline data={byMonth} />
        </Box>
      </Box>
    </Card>
  );
}
