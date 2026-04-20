"use client";

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type Props = { data: { month: number; total: number }[] };

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f172a", border: "none",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#4ade80" }}>
        {Number(payload[0].value).toFixed(2)}
        <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>tCO₂e</span>
      </p>
    </div>
  );
}

export function MonthlyTrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    month: MONTHS[d.month - 1],
    tCO2e: parseFloat(d.total.toFixed(3)),
  }));

  const avg = data.reduce((s, d) => s + d.total, 0) / data.filter(d => d.total > 0).length || 0;

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: "22px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{
          fontSize: "0.9375rem", fontWeight: 700,
          color: "#0f172a", margin: 0,
        }}>
          Monthly Emissions Trend
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: 2 }}>
          tCO₂e per month across all scopes
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              label={{
                value: "avg",
                position: "right",
                fontSize: 10,
                fill: "#cbd5e1",
              }}
            />
          )}
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1.5 }} />
          <Area
            type="monotone"
            dataKey="tCO2e"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#areaGrad)"
            dot={false}
            activeDot={{ r: 5, fill: "#16a34a", strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
