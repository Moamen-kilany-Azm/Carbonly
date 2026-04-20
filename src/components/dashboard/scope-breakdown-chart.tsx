"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft } from "lucide-react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";

type Activity = { name: string; co2eT: number };

type ScopeEntry = {
  name: string;
  value: number;
  color: string;
  activities: Activity[];
};

type Props = {
  data: ScopeEntry[];
};

function formatCO2e(n: number) {
  return n >= 100 ? n.toFixed(1) : n >= 1 ? n.toFixed(2) : n.toFixed(4);
}

export function ScopeBreakdownChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [drillScope, setDrillScope] = useState<ScopeEntry | null>(null);

  if (drillScope) {
    const max = Math.max(...drillScope.activities.map((a) => a.co2eT), 0);
    const pct = total > 0 ? (drillScope.value / total) * 100 : 0;

    return (
      <Card sx={{
        borderRadius: "16px", p: "22px 24px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "20px" }}>
          <IconButton
            onClick={() => setDrillScope(null)}
            size="small"
            sx={{
              width: 30, height: 30, borderRadius: "7px",
              border: "1px solid #e2e8f0", bgcolor: "#f8fafc",
              color: "#94a3b8",
            }}
          >
            <ArrowLeft size={14} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{
                display: "inline-block", width: 10, height: 10,
                borderRadius: "50%", bgcolor: drillScope.color, flexShrink: 0,
              }} />
              <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                {drillScope.name}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.8125rem", color: "#94a3b8", mt: "2px" }}>
              {formatCO2e(drillScope.value)} tCO&#x2082;e &middot; {pct.toFixed(1)}% of total
            </Typography>
          </Box>
        </Box>

        {/* Activity list */}
        {drillScope.activities.length === 0 ? (
          <Typography sx={{ textAlign: "center", color: "#94a3b8", fontSize: "0.875rem", py: 3 }}>
            No activities recorded
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {drillScope.activities.map((a, i) => {
              const barPct = max > 0 ? (a.co2eT / max) * 100 : 0;
              return (
                <Box key={a.name}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "4px", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                      <Box sx={{
                        width: 18, height: 18, borderRadius: "50%",
                        bgcolor: i === 0 ? drillScope.color : "#f1f5f9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.6rem", fontWeight: 700,
                        color: i === 0 ? "white" : "#94a3b8",
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </Box>
                      <Typography sx={{
                        fontSize: "0.8125rem", fontWeight: 500, color: "#0f172a",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {a.name}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>
                      {formatCO2e(a.co2eT)}
                      <Typography component="span" sx={{ fontSize: "0.7rem", fontWeight: 400, color: "#94a3b8", ml: "2px" }}>
                        t
                      </Typography>
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={barPct}
                    sx={{
                      height: 5, borderRadius: 99,
                      bgcolor: "#f1f5f9",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: drillScope.color, borderRadius: 99,
                        opacity: 0.75, transition: "width 0.35s ease",
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    );
  }

  // Default pie view
  return (
    <Card sx={{
      borderRadius: "16px", p: "22px 24px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <Box sx={{ mb: "12px" }}>
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
          Emissions by Scope
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "#94a3b8", mt: "2px" }}>
          Click a slice to drill into activities
        </Typography>
      </Box>

      {total === 0 ? (
        <Box sx={{ textAlign: "center", py: 5, color: "#94a3b8", fontSize: "0.875rem" }}>
          <Box sx={{ fontSize: "2rem", mb: 1 }}>&#x1F4CA;</Box>
          No emissions data yet
        </Box>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={86}
                paddingAngle={3}
                dataKey="value"
                style={{ cursor: "pointer" }}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(_, index) => setDrillScope(data[index] as ScopeEntry)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    stroke={activeIndex === index ? "white" : "none"}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                    style={{ transform: activeIndex === index ? "scale(1.04)" : "scale(1)", transformOrigin: "center", transition: "transform 0.15s" }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(2)} tCO\u2082e`, ""]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: "0.8125rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Custom legend as clickable chips */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap", mt: "4px" }}>
            {data.map((entry, i) => {
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
              return (
                <Box
                  key={entry.name}
                  component="button"
                  onClick={() => setDrillScope(entry)}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  sx={{
                    display: "flex", alignItems: "center", gap: "6px",
                    p: "5px 10px", borderRadius: 99,
                    border: `1.5px solid ${activeIndex === i ? entry.color : "#e2e8f0"}`,
                    bgcolor: activeIndex === i ? `${entry.color}18` : "#f8fafc",
                    cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                    color: "#64748b", transition: "all 0.12s ease",
                  }}
                >
                  <Box sx={{
                    width: 8, height: 8, borderRadius: "50%",
                    bgcolor: entry.color, flexShrink: 0,
                  }} />
                  {entry.name}
                  <Typography component="span" sx={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.8rem" }}>
                    {pct}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Card>
  );
}
