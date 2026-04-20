import { Gauge } from "lucide-react";

type ConsumptionEntry = {
  unit: string;
  total: number;
  activities: { name: string; quantity: number }[];
};

type Props = {
  data: ConsumptionEntry[];
};

const unitColors: Record<string, { bg: string; text: string; border: string }> = {
  kWh:  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  MWh:  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  L:    { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  km:   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  t:    { bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe" },
  kg:   { bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe" },
  m3:   { bg: "#ecfeff", text: "#0e7490", border: "#a5f3fc" },
  nights: { bg: "#fdf4ff", text: "#a21caf", border: "#f0abfc" },
};

function unitStyle(unit: string) {
  return unitColors[unit] ?? { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
}

function formatQty(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2);
}

export function ConsumptionBreakdown({ data }: Props) {
  if (data.length === 0) return null;

  const maxTotal = Math.max(...data.map((d) => d.total), 0);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)", padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#16a34a",
          }}
        >
          <Gauge size={16} />
        </div>
        <div>
          <h3
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Resource Consumption
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: 0 }}>
            Raw activity quantities by unit type
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {data.map((entry) => {
          const style = unitStyle(entry.unit);
          const topActivities = entry.activities.slice(0, 3);
          const pct = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;

          return (
            <div key={entry.unit}>
              {/* Unit header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: style.bg,
                    color: style.text,
                    border: `1px solid ${style.border}`,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                  }}
                >
                  {entry.unit}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "#f1f5f9",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: style.text,
                      borderRadius: 99,
                      opacity: 0.7,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                    flexShrink: 0,
                    minWidth: 80,
                    textAlign: "right",
                  }}
                >
                  {formatQty(entry.total)}
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      color: "#94a3b8",
                      marginLeft: 3,
                    }}
                  >
                    {entry.unit}
                  </span>
                </span>
              </div>

              {/* Activity breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 4 }}>
                {topActivities.map((a) => (
                  <div
                    key={a.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: style.text,
                          opacity: 0.5,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "#475569",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#475569",
                        flexShrink: 0,
                      }}
                    >
                      {formatQty(a.quantity)} {entry.unit}
                    </span>
                  </div>
                ))}
                {entry.activities.length > 3 && (
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", paddingLeft: 10 }}>
                    +{entry.activities.length - 3} more activities
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
