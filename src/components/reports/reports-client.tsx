"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Download, Trash2, Globe, X,
  Loader2, AlertCircle, CheckCircle, TrendingDown, TrendingUp,
  BarChart3, Calendar, ChevronDown, FileDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScopeSummary = {
  co2eT: number; pct: number;
  activities: { name: string; co2eT: number }[];
};

type ReportSummary = {
  totalCo2eT: number;
  recordCount: number;
  scope1: ScopeSummary;
  scope2: ScopeSummary;
  scope3: ScopeSummary;
  byMonth: { month: number; co2eT: number }[];
  topActivities: { name: string; co2eT: number; scope: number }[];
  baselineCo2eT: number | null;
  prevYearCo2eT: number | null;
  yoyChangePct: number | null;
  vsBaselinePct: number | null;
  entityName: string;
  generatedAt: string;
};

export type ClientReport = {
  id: string;
  year: number;
  title: string;
  status: "DRAFT" | "GENERATED" | "PUBLISHED";
  summary: ReportSummary | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const badgeBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600 };
const STATUS_STYLE: Record<string, { label: string; style: React.CSSProperties }> = {
  DRAFT:     { label: "Draft",     style: { ...badgeBase, background: "#f1f5f9", color: "#475569" }  },
  GENERATED: { label: "Generated", style: { ...badgeBase, background: "#dbeafe", color: "#1d4ed8" }  },
  PUBLISHED: { label: "Published", style: { ...badgeBase, background: "#dcfce7", color: "#15803d" } },
};
const badgeGray: React.CSSProperties = { ...badgeBase, background: "#f1f5f9", color: "#475569" };

const SCOPE_COLOR: Record<number, string> = { 1: "#4ade80", 2: "#60a5fa", 3: "#f59e0b" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n: number) {
  return n >= 1000
    ? (n / 1000).toFixed(1) + "k"
    : n.toFixed(n >= 10 ? 1 : 2);
}

// ─── Generate modal ───────────────────────────────────────────────────────────

function GenerateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: ClientReport) => void }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 }, (_, i) => currentYear - i);
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate report.");
        return;
      }
      onCreated(data as ClientReport);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", justifyContent: "flex-end",
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.18s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "75%", maxWidth: 760, height: "100%",
          background: "#ffffff",
          borderLeft: "1px solid #e2e8f0",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "24px 32px 20px", borderBottom: "1px solid #e2e8f0", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg,rgba(22,163,74,0.15),rgba(13,148,136,0.1))",
              border: "1px solid rgba(22,163,74,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#16a34a",
            }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>Generate Report</h2>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "#94a3b8" }}>Aggregate all emission data for a year</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", padding: 6, borderRadius: 8,
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#f1f5f9"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "none"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {/* Year picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Reporting Year
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{
                  width: "100%", padding: "10px 36px 10px 14px",
                  borderRadius: 9, border: "1px solid #e2e8f0",
                  background: "#f1f5f9", color: "#0f172a",
                  fontSize: "0.9375rem", fontWeight: 600, appearance: "none", cursor: "pointer",
                  outline: "none",
                }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}{y === 2021 ? " (Baseline)" : y === currentYear ? " (Current)" : ""}</option>
                ))}
              </select>
              <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Info note */}
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)",
            display: "flex", gap: 10, marginBottom: 24, alignItems: "flex-start",
          }}>
            <BarChart3 size={15} style={{ color: "#60a5fa", flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.6 }}>
              Carbonly will aggregate all emission records for <strong style={{ color: "#0f172a" }}>{year}</strong> and produce an ISO 14064-aligned GHG report with scope breakdowns, monthly trends and year-on-year comparisons.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 20,
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#ef4444" }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          display: "flex", gap: 10, padding: "16px 32px",
          borderTop: "1px solid #e2e8f0", flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", borderRadius: 9,
              border: "1px solid #e2e8f0", background: "#f1f5f9",
              fontSize: "0.875rem", fontWeight: 600, color: "#475569",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              flex: 2, padding: "11px", borderRadius: 9,
              border: "none",
              background: loading ? "rgba(22,163,74,0.5)" : "linear-gradient(135deg,#16a34a,#0d9488)",
              color: "white", fontSize: "0.875rem", fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            {loading ? <><Loader2 size={14} style={{ animation: "spin-slow 0.8s linear infinite" }} /> Generating…</> : <><FileText size={14} /> Generate Report</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report detail panel ──────────────────────────────────────────────────────

function ReportPanel({ report, onClose }: { report: ClientReport; onClose: () => void }) {
  const s = report.summary;
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  async function downloadFile(format: "csv" | "pdf") {
    const setter = format === "csv" ? setExportingCsv : setExportingPdf;
    setter(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/export?format=${format}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? `Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carbonly-ghg-report-${report.year}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setter(false);
    }
  }

  if (!s) return null;

  const maxMonth = Math.max(...s.byMonth.map(m => m.co2eT), 1);
  const scopes = [
    { label: "Scope 1", color: SCOPE_COLOR[1], data: s.scope1 },
    { label: "Scope 2", color: SCOPE_COLOR[2], data: s.scope2 },
    { label: "Scope 3", color: SCOPE_COLOR[3], data: s.scope3 },
  ];

  return (
    <div style={{
      marginTop: 24, borderRadius: 14,
      border: "1px solid #e2e8f0",
      background: "#ffffff",
      overflow: "hidden",
      animation: "fadeUp 0.25s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      {/* Panel header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #e2e8f0",
        background: "#f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={15} style={{ color: "#16a34a" }} />
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>{report.title}</span>
          <span style={STATUS_STYLE[report.status]?.style ?? badgeGray}>
            {STATUS_STYLE[report.status]?.label}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => downloadFile("csv")}
            disabled={exportingCsv || exportingPdf}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 14px", background: "#fff", color: "#0f172a", fontSize: "0.8125rem", fontWeight: 600, borderRadius: 8, border: "1.5px solid #e2e8f0", cursor: "pointer" }}
          >
            {exportingCsv ? <Loader2 size={13} style={{ animation: "spin-slow 0.8s linear infinite" }} /> : <Download size={13} />}
            CSV
          </button>
          <button
            onClick={() => downloadFile("pdf")}
            disabled={exportingCsv || exportingPdf}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 14px", background: "linear-gradient(135deg,#16a34a,#0d9488)", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", opacity: exportingPdf ? 0.7 : 1 }}
          >
            {exportingPdf ? <Loader2 size={13} style={{ animation: "spin-slow 0.8s linear infinite" }} /> : <FileDown size={13} />}
            Export PDF
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6, borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            {
              label: "Total Emissions",
              value: `${fmt(s.totalCo2eT)} tCO₂e`,
              sub: `${s.recordCount} records`,
              color: "#16a34a",
              bg: "rgba(22,163,74,0.07)",
              border: "rgba(22,163,74,0.2)",
            },
            {
              label: "vs Prior Year",
              value: s.yoyChangePct != null ? `${s.yoyChangePct > 0 ? "+" : ""}${s.yoyChangePct}%` : "N/A",
              sub: s.prevYearCo2eT != null ? `${fmt(s.prevYearCo2eT)} t in ${report.year - 1}` : "No prior data",
              color: s.yoyChangePct == null ? "#94a3b8" : s.yoyChangePct < 0 ? "#4ade80" : "#ef4444",
              bg: s.yoyChangePct == null ? "#f1f5f9" : s.yoyChangePct < 0 ? "rgba(74,222,128,0.07)" : "rgba(239,68,68,0.07)",
              border: s.yoyChangePct == null ? "#e2e8f0" : s.yoyChangePct < 0 ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)",
            },
            {
              label: "vs 2021 Baseline",
              value: s.vsBaselinePct != null ? `${s.vsBaselinePct > 0 ? "+" : ""}${s.vsBaselinePct}%` : report.year === 2021 ? "Baseline" : "N/A",
              sub: s.baselineCo2eT != null ? `${fmt(s.baselineCo2eT)} t baseline` : "–",
              color: s.vsBaselinePct == null ? "#94a3b8" : s.vsBaselinePct < 0 ? "#4ade80" : "#ef4444",
              bg: s.vsBaselinePct == null ? "#f1f5f9" : s.vsBaselinePct < 0 ? "rgba(74,222,128,0.07)" : "rgba(239,68,68,0.07)",
              border: s.vsBaselinePct == null ? "#e2e8f0" : s.vsBaselinePct < 0 ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)",
            },
            {
              label: "Data Quality",
              value: s.recordCount >= 50 ? "High" : s.recordCount >= 20 ? "Medium" : "Low",
              sub: `${s.recordCount} activity records`,
              color: s.recordCount >= 50 ? "#4ade80" : s.recordCount >= 20 ? "#f59e0b" : "#ef4444",
              bg: s.recordCount >= 50 ? "rgba(74,222,128,0.07)" : s.recordCount >= 20 ? "rgba(245,158,11,0.07)" : "rgba(239,68,68,0.07)",
              border: s.recordCount >= 50 ? "rgba(74,222,128,0.2)" : s.recordCount >= 20 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
            },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              padding: "14px 16px", borderRadius: 11,
              background: kpi.bg, border: `1px solid ${kpi.border}`,
            }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: kpi.color, lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16, marginBottom: 16 }}>
          {/* Scope breakdown */}
          <div style={{ padding: "16px", borderRadius: 11, border: "1px solid #e2e8f0", background: "#f1f5f9" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Scope Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {scopes.map((sc) => (
                <div key={sc.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#0f172a" }}>{sc.label}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{sc.data.pct}%</span>
                      <span style={{ fontSize: "0.825rem", fontWeight: 700, color: sc.color }}>{fmt(sc.data.co2eT)} t</span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#e2e8f0" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      background: sc.color, width: `${sc.data.pct}%`,
                      transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                    }} />
                  </div>
                  {sc.data.activities.slice(0, 2).map(a => (
                    <div key={a.name} style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingLeft: 8 }}>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>↳ {a.name}</span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{fmt(a.co2eT)} t</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend */}
          <div style={{ padding: "16px", borderRadius: 11, border: "1px solid #e2e8f0", background: "#f1f5f9" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Monthly Trend
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
              {s.byMonth.map((m) => (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div
                      title={`${MONTHS[m.month - 1]}: ${m.co2eT.toFixed(2)} tCO₂e`}
                      style={{
                        width: "100%", borderRadius: "3px 3px 0 0",
                        background: `rgba(22,163,74,${0.25 + (m.co2eT / maxMonth) * 0.6})`,
                        height: maxMonth > 0 ? `${(m.co2eT / maxMonth) * 100}%` : "4px",
                        minHeight: m.co2eT > 0 ? 4 : 2,
                        transition: "height 0.6s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "#94a3b8", textAlign: "center", letterSpacing: "0.02em" }}>
                    {MONTHS[m.month - 1]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top activities */}
        <div style={{ borderRadius: 11, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{
            padding: "12px 16px",
            background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
            fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            Top Emission Sources
          </div>
          <div>
            {s.topActivities.slice(0, 5).map((a, i) => (
              <div key={a.name} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 16px",
                borderBottom: i < 4 ? "1px solid #e2e8f0" : "none",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: `${SCOPE_COLOR[a.scope]}22`,
                  border: `1px solid ${SCOPE_COLOR[a.scope]}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 800, color: SCOPE_COLOR[a.scope],
                }}>
                  {i + 1}
                </div>
                <span style={{ flex: 1, fontSize: "0.875rem", color: "#0f172a", fontWeight: 500 }}>{a.name}</span>
                <span style={{
                  fontSize: "0.7rem", padding: "2px 8px", borderRadius: 100,
                  background: `${SCOPE_COLOR[a.scope]}15`,
                  color: SCOPE_COLOR[a.scope], fontWeight: 600,
                }}>
                  S{a.scope}
                </span>
                <div style={{ textAlign: "right", minWidth: 72 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>{fmt(a.co2eT)} t</div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                    {s.totalCo2eT > 0 ? ((a.co2eT / s.totalCo2eT) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

type Props = {
  initialReports: ClientReport[];
};

export function ReportsClient({ initialReports }: Props) {
  const router = useRouter();
  const [reports, setReports] = useState<ClientReport[]>(initialReports);
  const [showGenerate, setShowGenerate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleCreated(report: ClientReport) {
    setShowGenerate(false);
    setReports((prev) => [report, ...prev]);
    setExpandedId(report.id);
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
      startTransition(() => router.refresh());
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePublish(id: string, current: string) {
    const next = current === "PUBLISHED" ? "GENERATED" : "PUBLISHED";
    setPublishingId(id);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const updated = await res.json();
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: updated.status } : r));
    } finally {
      setPublishingId(null);
    }
  }

  async function handleExportCSV(id: string, year: number) {
    setExportingId(id);
    try {
      const res = await fetch(`/api/reports/${id}/export?format=csv`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `carbonly-ghg-report-${year}.csv`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingId(null);
    }
  }

  async function handleExportPDF(id: string, year: number) {
    setExportingPdfId(id);
    try {
      const res = await fetch(`/api/reports/${id}/export?format=pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "PDF export failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `carbonly-ghg-report-${year}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdfId(null);
    }
  }

  const expanded = reports.find((r) => r.id === expandedId);

  return (
    <div style={{ width: "100%" }}>
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Reports</h1>
          <p style={{ fontSize: "0.9375rem", color: "#475569", marginTop: 4 }}>
            {reports.length > 0
              ? `${reports.length} GHG report${reports.length !== 1 ? "s" : ""} · ISO 14064 aligned`
              : "Annual GHG emissions reports for your organisation"}
          </p>
        </div>
        <button
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 20px", background: "linear-gradient(135deg, #16a34a, #0d9488)", color: "white", fontSize: "0.9375rem", fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer" }}
          onClick={() => setShowGenerate(true)}
        >
          <Plus size={15} />
          Generate Report
        </button>
      </div>

      {/* Empty state */}
      {reports.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            border: "1px solid #bbf7d0",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16, color: "#16a34a",
          }}>
            <FileText size={24} />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
            No reports yet
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: "0 0 20px", maxWidth: 360, textAlign: "center" }}>
            Generate your first GHG report to get scope breakdowns, monthly trends and year‑on‑year comparisons.
          </p>
          <button onClick={() => setShowGenerate(true)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 20px", background: "linear-gradient(135deg, #16a34a, #0d9488)", color: "white", fontSize: "0.9375rem", fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer" }}>
            <Plus size={14} /> Generate Report
          </button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Report", "Year", "Status", "Records", "YoY Change", "Created", ""].map((h, i) => (
                    <th key={i} style={{ background: "#f8fafc", padding: "11px 16px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const s = r.summary;
                  const yoy = s?.yoyChangePct;
                  const isExpanded = expandedId === r.id;

                  return (
                    <tr
                      key={r.id}
                      style={{ background: isExpanded ? "rgba(22,163,74,0.03)" : undefined, cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      {/* Title */}
                      <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8,
                            background: isExpanded ? "rgba(22,163,74,0.12)" : "#f1f5f9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: isExpanded ? "#16a34a" : "#94a3b8", flexShrink: 0,
                            transition: "all 0.2s",
                          }}>
                            <FileText size={15} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>{r.title}</div>
                            {s && <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 1 }}>{s.entityName}</div>}
                          </div>
                        </div>
                      </td>
                      {/* Year */}
                      <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
                        <span style={{ ...badgeGray, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={11} /> {r.year}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
                        <span style={STATUS_STYLE[r.status]?.style ?? badgeGray}>
                          {r.status === "PUBLISHED" && <CheckCircle size={11} style={{ marginRight: 3 }} />}
                          {STATUS_STYLE[r.status]?.label}
                        </span>
                      </td>
                      {/* Records */}
                      <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>
                        {s ? s.recordCount : "–"}
                      </td>
                      {/* YoY */}
                      <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
                        {yoy != null ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: "0.8125rem", fontWeight: 700,
                            color: yoy < 0 ? "#16a34a" : "#ef4444",
                          }}>
                            {yoy < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                            {yoy > 0 ? "+" : ""}{yoy}%
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>–</span>
                        )}
                      </td>
                      {/* Date */}
                      <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#475569", whiteSpace: "nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "13px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f1f5f9", color: "#0f172a" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {/* Publish toggle */}
                          <button
                            onClick={() => handlePublish(r.id, r.status)}
                            disabled={publishingId === r.id || r.status === "DRAFT"}
                            title={r.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "5px 10px", borderRadius: 6,
                              border: "1px solid #e2e8f0",
                              background: r.status === "PUBLISHED" ? "rgba(22,163,74,0.1)" : "#ffffff",
                              color: r.status === "PUBLISHED" ? "#16a34a" : "#94a3b8",
                              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                              opacity: r.status === "DRAFT" ? 0.4 : 1,
                            }}
                          >
                            {publishingId === r.id
                              ? <Loader2 size={11} style={{ animation: "spin-slow 0.8s linear infinite" }} />
                              : <Globe size={11} />}
                            {r.status === "PUBLISHED" ? "Published" : "Publish"}
                          </button>
                          {/* Export CSV */}
                          <button
                            onClick={() => handleExportCSV(r.id, r.year)}
                            disabled={exportingId === r.id || exportingPdfId === r.id || !r.summary}
                            title="Export CSV"
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "5px 10px", borderRadius: 6,
                              border: "1px solid #e2e8f0",
                              background: "#ffffff",
                              fontSize: "0.78rem", fontWeight: 600,
                              color: "#475569", cursor: "pointer",
                            }}
                          >
                            {exportingId === r.id
                              ? <Loader2 size={11} style={{ animation: "spin-slow 0.8s linear infinite" }} />
                              : <Download size={11} />}
                            CSV
                          </button>
                          {/* Export PDF */}
                          <button
                            onClick={() => handleExportPDF(r.id, r.year)}
                            disabled={exportingPdfId === r.id || exportingId === r.id || !r.summary}
                            title="Export PDF"
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "5px 10px", borderRadius: 6,
                              border: "none",
                              background: exportingPdfId === r.id
                                ? "rgba(22,163,74,0.5)"
                                : "linear-gradient(135deg,#16a34a,#0d9488)",
                              fontSize: "0.78rem", fontWeight: 600,
                              color: "#ffffff", cursor: "pointer",
                            }}
                          >
                            {exportingPdfId === r.id
                              ? <Loader2 size={11} style={{ animation: "spin-slow 0.8s linear infinite" }} />
                              : <FileDown size={11} />}
                            PDF
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            title="Delete report"
                            style={{
                              display: "flex", alignItems: "center",
                              padding: "5px 8px", borderRadius: 6,
                              border: "1px solid #e2e8f0",
                              background: "#ffffff",
                              color: "#94a3b8", cursor: "pointer",
                            }}
                          >
                            {deletingId === r.id
                              ? <Loader2 size={12} style={{ animation: "spin-slow 0.8s linear infinite" }} />
                              : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded panel */}
          {expanded && expanded.summary && (
            <ReportPanel
              report={expanded}
              onClose={() => setExpandedId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
