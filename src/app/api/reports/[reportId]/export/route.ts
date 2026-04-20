import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ reportId: string }> };

type ScopeSummary = { co2eT: number; pct: number; activities: { name: string; co2eT: number }[] };
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(val: string | number | null | undefined): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCSV).join(",");
}

// ─── PDF HTML builder ─────────────────────────────────────────────────────────

function buildReportHtml(report: { year: number; title: string; status: string }, s: ReportSummary): string {
  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(n >= 10 ? 1 : 2);
  const fmtFull = (n: number) => n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const maxMonth = Math.max(...s.byMonth.map(m => m.co2eT), 1);

  const yoyColor  = s.yoyChangePct  == null ? "#94a3b8" : s.yoyChangePct  < 0 ? "#16a34a" : "#ef4444";
  const baseColor = s.vsBaselinePct == null ? "#94a3b8" : s.vsBaselinePct < 0 ? "#16a34a" : "#ef4444";

  const scopeRows = [
    { label: "Scope 1", sub: "Direct emissions", color: "#16a34a", bg: "#f0fdf4", data: s.scope1 },
    { label: "Scope 2", sub: "Purchased energy", color: "#2563eb", bg: "#eff6ff", data: s.scope2 },
    { label: "Scope 3", sub: "Value chain",      color: "#d97706", bg: "#fffbeb", data: s.scope3 },
  ];

  const monthBars = s.byMonth.map(m => {
    const pct = maxMonth > 0 ? ((m.co2eT / maxMonth) * 100).toFixed(1) : "0";
    return `
      <div class="month-col">
        <div class="bar-wrap">
          <div class="bar" style="height:${pct}%" title="${MONTH_FULL[m.month - 1]}: ${fmtFull(m.co2eT)} tCO₂e"></div>
        </div>
        <div class="month-label">${MONTHS[m.month - 1]}</div>
      </div>`;
  }).join("");

  const topRows = s.topActivities.slice(0, 10).map((a, i) => {
    const pct = s.totalCo2eT > 0 ? ((a.co2eT / s.totalCo2eT) * 100).toFixed(1) : "0";
    const sc = a.scope === 1 ? "#16a34a" : a.scope === 2 ? "#2563eb" : "#d97706";
    return `
      <tr>
        <td class="rank">${i + 1}</td>
        <td>${a.name}</td>
        <td><span class="scope-chip" style="background:${sc}22;color:${sc}">S${a.scope}</span></td>
        <td class="num">${fmtFull(a.co2eT)}</td>
        <td class="num">${pct}%</td>
        <td>
          <div class="pct-bar-bg">
            <div class="pct-bar" style="width:${pct}%;background:${sc}"></div>
          </div>
        </td>
      </tr>`;
  }).join("");

  const activityRows = [
    ...s.scope1.activities.map(a => ({ ...a, scope: 1, color: "#16a34a" })),
    ...s.scope2.activities.map(a => ({ ...a, scope: 2, color: "#2563eb" })),
    ...s.scope3.activities.map(a => ({ ...a, scope: 3, color: "#d97706" })),
  ].map(a => `
    <tr>
      <td><span class="scope-chip" style="background:${a.color}22;color:${a.color}">S${a.scope}</span></td>
      <td>${a.name}</td>
      <td class="num">${fmtFull(a.co2eT)}</td>
      <td class="num">${s.totalCo2eT > 0 ? ((a.co2eT / s.totalCo2eT) * 100).toFixed(1) : "0"}%</td>
    </tr>`).join("");

  const generatedDate = new Date(s.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${report.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #0f172a;
    background: #ffffff;
  }
  main { max-width: 820px; margin: 0 auto; padding: 44px 52px 64px; }

  /* ── Cover ── */
  .cover {
    background: linear-gradient(135deg, #052e16 0%, #14532d 50%, #064e3b 100%);
    color: white;
    border-radius: 14px;
    padding: 40px 44px;
    margin-bottom: 36px;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: "";
    position: absolute;
    top: -40px; right: -40px;
    width: 220px; height: 220px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }
  .cover-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 99px;
    padding: 4px 12px;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.85);
    margin-bottom: 16px;
  }
  .cover h1 { font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
  .cover-sub { font-size: 10pt; color: rgba(255,255,255,0.65); margin-bottom: 24px; }
  .cover-meta {
    display: flex; gap: 28px;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 20px; margin-top: 4px;
  }
  .cover-meta-item { }
  .cover-meta-item .label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(255,255,255,0.5); margin-bottom: 3px; }
  .cover-meta-item .value { font-size: 1.5rem; font-weight: 900; color: #4ade80; line-height: 1; }
  .cover-meta-item .unit  { font-size: 8.5pt; color: rgba(255,255,255,0.6); margin-top: 2px; }

  /* ── Section heading ── */
  .section-heading {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #94a3b8;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px; margin: 28px 0 16px;
  }

  /* ── KPI grid ── */
  .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 28px; }
  .kpi-card {
    border-radius: 10px; padding: 14px 16px;
    border: 1px solid #e2e8f0; background: #f8fafc;
  }
  .kpi-card .kpi-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; margin-bottom: 6px; }
  .kpi-card .kpi-value { font-size: 1.3rem; font-weight: 900; line-height: 1; }
  .kpi-card .kpi-sub   { font-size: 7.5pt; color: #94a3b8; margin-top: 4px; }

  /* ── Scope breakdown ── */
  .scope-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px; }
  .scope-card {
    border-radius: 10px; padding: 16px;
    border: 1px solid #e2e8f0;
    page-break-inside: avoid;
  }
  .scope-card .scope-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .scope-card .scope-name  { font-size: 9pt; font-weight: 700; }
  .scope-card .scope-sub   { font-size: 7.5pt; color: #94a3b8; margin-top: 1px; }
  .scope-card .scope-val   { font-size: 1.15rem; font-weight: 900; }
  .scope-card .scope-pct   { font-size: 7.5pt; color: #94a3b8; margin-top: 2px; text-align: right; }
  .scope-bar-bg { height: 5px; background: #e2e8f0; border-radius: 3px; margin-bottom: 10px; }
  .scope-bar    { height: 100%; border-radius: 3px; }
  .scope-act    { font-size: 7.5pt; color: #94a3b8; display: flex; justify-content: space-between; padding: 3px 0; border-top: 1px solid #f1f5f9; }

  /* ── Monthly chart ── */
  .chart-wrap {
    border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 20px 20px 14px; margin-bottom: 28px;
    page-break-inside: avoid;
    background: #f8fafc;
  }
  .chart-inner { display: flex; align-items: flex-end; gap: 5px; height: 120px; }
  .month-col   { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
  .bar-wrap    { flex: 1; width: 100%; display: flex; align-items: flex-end; }
  .bar         {
    width: 100%; border-radius: 3px 3px 0 0; min-height: 3px;
    background: linear-gradient(180deg, #16a34a, #0d9488);
    transition: height 0s;
  }
  .month-label { font-size: 6.5pt; color: #94a3b8; letter-spacing: 0.02em; }

  /* ── Tables ── */
  table    { width: 100%; border-collapse: collapse; font-size: 9pt; page-break-inside: avoid; margin-bottom: 28px; }
  thead th {
    background: #f1f5f9; padding: 8px 12px;
    text-align: left; font-size: 7.5pt; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: #64748b; border-bottom: 1px solid #e2e8f0;
  }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #fafafa; }
  td.rank { font-size: 8pt; font-weight: 800; color: #94a3b8; width: 28px; }
  td.num  { font-weight: 700; text-align: right; white-space: nowrap; }
  .scope-chip {
    display: inline-block; padding: 1px 7px; border-radius: 99px;
    font-size: 7.5pt; font-weight: 700;
  }
  .pct-bar-bg { height: 5px; background: #e2e8f0; border-radius: 3px; min-width: 60px; }
  .pct-bar    { height: 100%; border-radius: 3px; }

  /* ── Footer ── */
  .footer {
    margin-top: 36px; padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 8pt; color: #94a3b8;
  }
  .footer .brand { font-weight: 700; color: #16a34a; }

  /* ── Status badge ── */
  .status-badge {
    display: inline-block; padding: 2px 10px; border-radius: 99px;
    font-size: 8pt; font-weight: 700;
  }

  @page { margin: 16mm 16mm 22mm 16mm; }
</style>
</head>
<body>
<main>

  <!-- Cover -->
  <div class="cover">
    <div class="cover-tag">GHG Emissions Report · ISO 14064 Aligned</div>
    <h1>${report.title}</h1>
    <div class="cover-sub">
      ${s.entityName} &nbsp;·&nbsp; Reporting year ${report.year} &nbsp;·&nbsp; Generated ${generatedDate}
    </div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="label">Total Emissions</div>
        <div class="value">${fmtFull(s.totalCo2eT)}</div>
        <div class="unit">metric tonnes CO₂e</div>
      </div>
      <div class="cover-meta-item">
        <div class="label">Activity Records</div>
        <div class="value" style="color:#60a5fa">${s.recordCount}</div>
        <div class="unit">data points logged</div>
      </div>
      <div class="cover-meta-item">
        <div class="label">Year-on-Year</div>
        <div class="value" style="color:${s.yoyChangePct != null && s.yoyChangePct < 0 ? "#4ade80" : "#fb923c"}">
          ${s.yoyChangePct != null ? (s.yoyChangePct > 0 ? "+" : "") + s.yoyChangePct + "%" : "N/A"}
        </div>
        <div class="unit">vs ${report.year - 1}</div>
      </div>
      <div class="cover-meta-item">
        <div class="label">vs 2021 Baseline</div>
        <div class="value" style="color:${s.vsBaselinePct != null && s.vsBaselinePct < 0 ? "#4ade80" : "#fb923c"}">
          ${s.vsBaselinePct != null ? (s.vsBaselinePct > 0 ? "+" : "") + s.vsBaselinePct + "%" : report.year === 2021 ? "Baseline" : "N/A"}
        </div>
        <div class="unit">vs 2021</div>
      </div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="section-heading">Executive Summary</div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Emissions</div>
      <div class="kpi-value" style="color:#16a34a">${fmt(s.totalCo2eT)} t</div>
      <div class="kpi-sub">${fmtFull(s.totalCo2eT)} tCO₂e</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">vs Prior Year ${report.year - 1}</div>
      <div class="kpi-value" style="color:${yoyColor}">
        ${s.yoyChangePct != null ? (s.yoyChangePct > 0 ? "+" : "") + s.yoyChangePct + "%" : "N/A"}
      </div>
      <div class="kpi-sub">${s.prevYearCo2eT != null ? fmtFull(s.prevYearCo2eT) + " t in " + (report.year - 1) : "No prior data"}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">vs 2021 Baseline</div>
      <div class="kpi-value" style="color:${baseColor}">
        ${s.vsBaselinePct != null ? (s.vsBaselinePct > 0 ? "+" : "") + s.vsBaselinePct + "%" : report.year === 2021 ? "Baseline" : "N/A"}
      </div>
      <div class="kpi-sub">${s.baselineCo2eT != null ? fmtFull(s.baselineCo2eT) + " t baseline" : "–"}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Data Quality</div>
      <div class="kpi-value" style="color:${s.recordCount >= 50 ? "#16a34a" : s.recordCount >= 20 ? "#d97706" : "#ef4444"}">
        ${s.recordCount >= 50 ? "High" : s.recordCount >= 20 ? "Medium" : "Low"}
      </div>
      <div class="kpi-sub">${s.recordCount} activity records</div>
    </div>
  </div>

  <!-- Scope Breakdown -->
  <div class="section-heading">Scope Breakdown</div>
  <div class="scope-grid">
    ${scopeRows.map(sc => `
    <div class="scope-card" style="background:${sc.bg};border-color:${sc.color}33">
      <div class="scope-header">
        <div>
          <div class="scope-name" style="color:${sc.color}">${sc.label}</div>
          <div class="scope-sub">${sc.sub}</div>
        </div>
        <div>
          <div class="scope-val" style="color:${sc.color}">${fmt(sc.data.co2eT)} t</div>
          <div class="scope-pct">${sc.data.pct}%</div>
        </div>
      </div>
      <div class="scope-bar-bg">
        <div class="scope-bar" style="width:${sc.data.pct}%;background:${sc.color}"></div>
      </div>
      ${sc.data.activities.slice(0, 4).map(a => `
      <div class="scope-act">
        <span>${a.name}</span>
        <span style="font-weight:600;color:#475569">${fmtFull(a.co2eT)} t</span>
      </div>`).join("")}
    </div>`).join("")}
  </div>

  <!-- Monthly Trend -->
  <div class="section-heading">Monthly Trend — ${report.year}</div>
  <div class="chart-wrap">
    <div class="chart-inner">
      ${monthBars}
    </div>
  </div>

  <!-- Top Emission Sources -->
  <div class="section-heading">Top Emission Sources</div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Activity</th>
        <th>Scope</th>
        <th style="text-align:right">tCO₂e</th>
        <th style="text-align:right">% of Total</th>
        <th style="min-width:80px"></th>
      </tr>
    </thead>
    <tbody>${topRows}</tbody>
  </table>

  <!-- All Activities -->
  <div class="section-heading">All Activities by Scope</div>
  <table>
    <thead>
      <tr>
        <th>Scope</th>
        <th>Activity</th>
        <th style="text-align:right">tCO₂e</th>
        <th style="text-align:right">% of Total</th>
      </tr>
    </thead>
    <tbody>${activityRows}</tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div>
      Generated by <span class="brand">Carbonly</span> &nbsp;·&nbsp;
      <a href="https://carbonly.io" style="color:#16a34a;text-decoration:none">carbonly.io</a>
    </div>
    <div>
      ${s.entityName} &nbsp;·&nbsp; ${report.year} Annual GHG Report &nbsp;·&nbsp;
      <span style="text-transform:capitalize">${report.status.toLowerCase()}</span>
    </div>
  </div>

</main>
</body>
</html>`;
}

// ─── GET /api/reports/[reportId]/export?format=csv|pdf ────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.entityId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "csv";

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.entityId !== session.user.entityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!report.summary) {
    return NextResponse.json({ error: "Report has no summary data" }, { status: 422 });
  }

  const s = report.summary as unknown as ReportSummary;

  // ── CSV ───────────────────────────────────────────────────────────────────
  if (format === "csv") {
    const lines: string[] = [];

    lines.push(row("Carbonly — GHG Emissions Report"));
    lines.push(row("Organisation", s.entityName));
    lines.push(row("Year", report.year));
    lines.push(row("Report Title", report.title));
    lines.push(row("Generated", new Date(s.generatedAt).toLocaleString()));
    lines.push(row("Status", report.status));
    lines.push("");

    lines.push(row("SUMMARY"));
    lines.push(row("Metric", "Value"));
    lines.push(row("Total Emissions (tCO₂e)", s.totalCo2eT));
    lines.push(row("Data Points", s.recordCount));
    if (s.prevYearCo2eT != null) lines.push(row(`Prior Year ${report.year - 1} (tCO₂e)`, s.prevYearCo2eT));
    if (s.yoyChangePct != null) lines.push(row("Year-on-Year Change (%)", s.yoyChangePct));
    if (s.baselineCo2eT != null) lines.push(row("Baseline 2021 (tCO₂e)", s.baselineCo2eT));
    if (s.vsBaselinePct != null) lines.push(row("Vs Baseline Change (%)", s.vsBaselinePct));
    lines.push("");

    lines.push(row("SCOPE BREAKDOWN"));
    lines.push(row("Scope", "tCO₂e", "% of Total"));
    for (const [label, scope] of [["Scope 1 — Direct", s.scope1], ["Scope 2 — Purchased Energy", s.scope2], ["Scope 3 — Value Chain", s.scope3]] as [string, ScopeSummary][]) {
      lines.push(row(label, scope.co2eT, scope.pct + "%"));
    }
    lines.push("");

    lines.push(row("ACTIVITIES BY SCOPE"));
    lines.push(row("Scope", "Activity", "tCO₂e"));
    for (const [label, scope] of [["Scope 1", s.scope1], ["Scope 2", s.scope2], ["Scope 3", s.scope3]] as [string, ScopeSummary][]) {
      for (const a of scope.activities) {
        lines.push(row(label, a.name, a.co2eT));
      }
    }
    lines.push("");

    lines.push(row("MONTHLY TREND"));
    lines.push(row("Month", "tCO₂e"));
    for (const m of s.byMonth) {
      lines.push(row(MONTHS[m.month - 1], m.co2eT));
    }
    lines.push("");

    lines.push(row("TOP ACTIVITIES"));
    lines.push(row("Rank", "Activity", "Scope", "tCO₂e"));
    s.topActivities.forEach((a, i) => {
      lines.push(row(i + 1, a.name, `Scope ${a.scope}`, a.co2eT));
    });
    lines.push("");
    lines.push(row("This report was generated by Carbonly (carbonly.io)"));

    const csv = lines.join("\r\n");
    const filename = `carbonly-ghg-report-${report.year}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (format === "pdf") {
    try {
      // Dynamic import so the build doesn't fail if puppeteer isn't bundled
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteer = require("puppeteer");

      const html = buildReportHtml(
        { year: report.year, title: report.title, status: report.status },
        s,
      );

      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBytes = await page.pdf({
        format: "A4",
        margin: { top: "16mm", right: "16mm", bottom: "22mm", left: "16mm" },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;padding:0 16mm;font-family:sans-serif;"></div>`,
        footerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;padding:0 16mm;font-family:sans-serif;text-align:center;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`,
      });

      await browser.close();

      const filename = `carbonly-ghg-report-${report.year}.pdf`;
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

      return new NextResponse(pdfBlob, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (err) {
      console.error("[PDF export] Failed:", err);
      return NextResponse.json(
        { error: "PDF generation failed. Make sure puppeteer is installed (`npm install puppeteer`)." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Unsupported format. Use ?format=csv or ?format=pdf" }, { status: 400 });
}
