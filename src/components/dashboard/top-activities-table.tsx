import { formatCO2e } from "@/lib/utils/format";

type Props = {
  activities: { name: string; co2eT: number }[];
};

const BAR_COLORS = [
  "linear-gradient(90deg, #16a34a, #0d9488)",
  "linear-gradient(90deg, #22c55e, #16a34a)",
  "linear-gradient(90deg, #4ade80, #22c55e)",
  "linear-gradient(90deg, #86efac, #4ade80)",
  "linear-gradient(90deg, #bbf7d0, #86efac)",
];

const RANK_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];

export function TopActivitiesTable({ activities }: Props) {
  const max = Math.max(...activities.map((a) => a.co2eT), 0);
  const total = activities.reduce((s, a) => s + a.co2eT, 0);

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: "22px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          Top Emission Sources
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: 2 }}>
          Highest contributing activities this period
        </p>
      </div>

      {activities.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "36px 0", color: "#94a3b8",
        }}>
          <span style={{ fontSize: "2rem", marginBottom: 10 }}>📋</span>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>No records yet</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", opacity: 0.7 }}>Add data in the Calculator</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {activities.map((a, i) => {
            const barPct = max > 0 ? (a.co2eT / max) * 100 : 0;
            const sharePct = total > 0 ? (a.co2eT / total) * 100 : 0;

            return (
              <div key={a.name}>
                {/* Top row */}
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 10, marginBottom: 7,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    {/* Rank badge */}
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: i === 0 ? RANK_COLORS[0] : "#f1f5f9",
                      border: `2px solid ${RANK_COLORS[i] ?? "#e2e8f0"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.625rem", fontWeight: 800,
                      color: i === 0 ? "white" : "#94a3b8",
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{
                      fontSize: "0.875rem", fontWeight: 600, color: "#0f172a",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {a.name}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700,
                      color: RANK_COLORS[i] ?? "#94a3b8",
                      background: i === 0 ? "rgba(22,163,74,0.1)" : "#f8fafc",
                      padding: "2px 7px", borderRadius: 99,
                    }}>
                      {sharePct.toFixed(1)}%
                    </span>
                    <span style={{
                      fontSize: "0.9rem", fontWeight: 800,
                      color: "#0f172a", letterSpacing: "-0.02em",
                    }}>
                      {formatCO2e(a.co2eT)}
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 400,
                        color: "#94a3b8", marginLeft: 2,
                      }}>t</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: 6, background: "#f1f5f9",
                  borderRadius: 99, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${barPct}%`,
                    background: BAR_COLORS[i] ?? BAR_COLORS[4],
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
