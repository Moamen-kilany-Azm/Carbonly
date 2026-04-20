"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmissionSchema, type CreateEmissionInput } from "@/lib/validations/emission.schema";
import { Calculator, CheckCircle2, Loader2, ChevronDown } from "lucide-react";

type Activity = {
  id: string;
  name: string;
  unit: string;
  equation: string;
  description?: string | null;
  emissionFactors: { id: string; name: string; value: number; unit: string; source?: string | null }[];
};

type Scope = {
  id: string;
  number: number;
  name: string;
  activities: Activity[];
};

type Props = {
  scope: Scope;
  entityId: string;
  userId: string;
};

export function ScopeCalculator({ scope }: Props) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [result, setResult] = useState<{ co2eKg: number; co2eT: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateEmissionInput>({
    resolver: zodResolver(createEmissionSchema),
  });

  const selectedFactorId = watch("emissionFactorId");
  const selectedFactor = selectedActivity?.emissionFactors.find(
    (f) => f.id === selectedFactorId
  );

  const onActivityChange = (activityId: string) => {
    const act = scope.activities.find((a) => a.id === activityId) ?? null;
    setSelectedActivity(act);
    setResult(null);
    setSaved(false);
  };

  const onSubmit = async (data: CreateEmissionInput) => {
    setSaving(true);
    try {
      const res = await fetch("/api/emissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        setResult({ co2eKg: json.co2eKg, co2eT: json.co2eT });
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    appearance: "none" as const,
    width: "100%",
    padding: "10px 36px 10px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    background: `#ffffff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center`,
    color: "#0f172a",
    fontSize: "0.9375rem",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)", padding: "28px 28px", maxWidth: 640 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, #16a34a, #0d9488)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calculator size={17} color="white" />
          </div>
          <div>
            <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Emission Calculator
            </p>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              GHG Protocol — {scope.activities.length} activities available
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Activity selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Activity type</label>
            <select
              style={selectStyle}
              {...register("activityId")}
              onChange={(e) => onActivityChange(e.target.value)}
            >
              <option value="">Select an activity…</option>
              {scope.activities.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.activityId && (
              <p style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: 4 }}>{errors.activityId.message}</p>
            )}
          </div>

          {selectedActivity && (
            <>
              {selectedActivity.description && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#f1f5f9",
                    borderRadius: 8,
                    fontSize: "0.875rem",
                    color: "#475569",
                    borderLeft: "3px solid #22c55e",
                  }}
                >
                  {selectedActivity.description}
                </div>
              )}

              {/* Emission factor */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Emission factor</label>
                <select style={selectStyle} {...register("emissionFactorId")}>
                  <option value="">Select emission factor…</option>
                  {selectedActivity.emissionFactors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.value} {f.unit}{f.source ? ` (${f.source})` : ""}
                    </option>
                  ))}
                </select>
                {errors.emissionFactorId && (
                  <p style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: 4 }}>{errors.emissionFactorId.message}</p>
                )}
              </div>

              {/* Quantity + period */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                    Quantity ({selectedActivity.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#0f172a", fontSize: "0.9375rem", outline: "none" }}
                    placeholder="0.00"
                    {...register("quantity", { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: 4 }}>{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>Period</label>
                  <input
                    type="month"
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#0f172a", fontSize: "0.9375rem", outline: "none" }}
                    {...register("period", {
                      setValueAs: (v: string) => v ? new Date(v + "-01").toISOString() : v,
                    })}
                  />
                  {errors.period && (
                    <p style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: 4 }}>{errors.period.message}</p>
                  )}
                </div>
              </div>

              <input type="hidden" value={selectedActivity.unit} {...register("unit")} />

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Notes{" "}
                  <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
                </label>
                <textarea
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#0f172a", fontSize: "0.9375rem", outline: "none", resize: "vertical" }}
                  {...register("notes")}
                />
              </div>

              {/* Formula hint */}
              {selectedFactor && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    fontSize: "0.8125rem",
                    color: "#15803d",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div><strong>Formula:</strong> {selectedActivity.equation}</div>
                  <div>
                    <strong>Factor:</strong> {selectedFactor.value} {selectedFactor.unit}
                    {selectedFactor.source && <span style={{ opacity: 0.7 }}> · {selectedFactor.source}</span>}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={saving || !selectedActivity}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #16a34a, #0d9488)", color: "white", fontSize: "0.9375rem", fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", width: "100%" }}
          >
            {saving ? (
              <>
                <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />
                Calculating & saving…
              </>
            ) : (
              <>
                <Calculator size={15} />
                Calculate & Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && saved && (
        <div
          style={{
            marginTop: 20,
            padding: "24px 28px",
            background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
            border: "1px solid #bbf7d0",
            borderRadius: 16,
            maxWidth: 640,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#15803d", margin: 0 }}>
              Calculation saved
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div
              style={{
                background: "white",
                borderRadius: 10,
                padding: "14px 16px",
                border: "1px solid #bbf7d0",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600, margin: "0 0 4px" }}>
                CO₂e (kg)
              </p>
              <p style={{ fontSize: "1.875rem", fontWeight: 800, color: "#15803d", margin: 0, letterSpacing: "-0.02em" }}>
                {result.co2eKg.toFixed(3)}
              </p>
            </div>
            <div
              style={{
                background: "white",
                borderRadius: 10,
                padding: "14px 16px",
                border: "1px solid #bbf7d0",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600, margin: "0 0 4px" }}>
                CO₂e (tonnes)
              </p>
              <p style={{ fontSize: "1.875rem", fontWeight: 800, color: "#15803d", margin: 0, letterSpacing: "-0.02em" }}>
                {result.co2eT.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
