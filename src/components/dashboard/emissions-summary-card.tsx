import { formatCO2e } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  title: string;
  value: number;
  unit: string;
  color: "green" | "blue" | "amber" | "purple";
  icon?: React.ReactNode;
  trend?: number;
};

const colorClass: Record<string, string> = {
  green: "stat-green",
  blue: "stat-blue",
  amber: "stat-amber",
  purple: "stat-purple",
};

const iconBg: Record<string, string> = {
  green: "rgba(22,163,74,0.15)",
  blue: "rgba(59,130,246,0.15)",
  amber: "rgba(245,158,11,0.15)",
  purple: "rgba(124,58,237,0.15)",
};

const iconColor: Record<string, string> = {
  green: "#15803d",
  blue: "#1d4ed8",
  amber: "#b45309",
  purple: "#7c3aed",
};

export function EmissionsSummaryCard({ title, value, color, icon, trend }: Props) {
  return (
    <div
      className={`card card-hover ${colorClass[color]}`}
      style={{ padding: "20px 22px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: iconColor[color],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: 0,
              opacity: 0.8,
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: "1.875rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.03em",
              margin: "6px 0 0",
              lineHeight: 1,
            }}
          >
            {formatCO2e(value)}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#94a3b8",
              marginTop: 4,
            }}
          >
            tCO₂e
          </p>
        </div>

        {icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: iconBg[color],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconColor[color],
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {trend > 0 ? (
            <TrendingUp size={13} color="#dc2626" />
          ) : trend < 0 ? (
            <TrendingDown size={13} color="#16a34a" />
          ) : (
            <Minus size={13} color="#94a3b8" />
          )}
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: trend > 0 ? "#dc2626" : trend < 0 ? "#16a34a" : "#94a3b8",
            }}
          >
            {trend > 0 ? "+" : ""}{trend.toFixed(1)}% vs last year
          </span>
        </div>
      )}
    </div>
  );
}
