/**
 * Generates styled PDFs from Carbonly Markdown documentation.
 * Supports: USER_STORIES.md → Carbonly-UserStories.pdf
 *           BRD.md          → Carbonly-BRD.pdf
 *
 * Usage:
 *   node scripts/generate-docs-pdf.mjs            # generates both
 *   node scripts/generate-docs-pdf.mjs brd        # BRD only
 *   node scripts/generate-docs-pdf.mjs stories    # User Stories only
 */

import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// ── Docs to generate ────────────────────────────────────────────────────────
const DOCS = {
  brd: {
    key: "brd",
    input: join(projectRoot, "docs/BRD.md"),
    output: join(projectRoot, "docs/Carbonly-BRD.pdf"),
    title: "Carbonly — Business Requirements Document",
    subtitle: "v2.0 · April 2026",
    accentColor: "#16a34a",
  },
  stories: {
    key: "stories",
    input: join(projectRoot, "docs/USER_STORIES.md"),
    output: join(projectRoot, "docs/Carbonly-UserStories.pdf"),
    title: "Carbonly — User Stories & Acceptance Criteria",
    subtitle: "v2.0 · April 2026",
    accentColor: "#0d9488",
  },
};

// ── Argument parsing ─────────────────────────────────────────────────────────
const arg = process.argv[2]?.toLowerCase();
const toGenerate = arg === "brd"
  ? [DOCS.brd]
  : arg === "stories"
  ? [DOCS.stories]
  : [DOCS.brd, DOCS.stories];

// ── Configure marked ─────────────────────────────────────────────────────────
marked.use({
  renderer: {
    code(token) {
      const rawCode = typeof token === "object" ? token.text : token;
      const language = typeof token === "object" ? token.lang : "";
      const escaped = rawCode
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre><code class="language-${language ?? ""}">${escaped}</code></pre>`;
    },
  },
});

// ── HTML template ─────────────────────────────────────────────────────────────
function buildHtml(doc, htmlBody) {
  const { title, subtitle, accentColor } = doc;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    :root {
      --fg: #0f172a;
      --muted: #475569;
      --accent: ${accentColor};
      --accent-light: ${accentColor}22;
      --border: #e2e8f0;
      --bg: #ffffff;
      --code-bg: #f8fafc;
      --row-alt: #fafafa;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.6;
    }
    main { max-width: 800px; margin: 0 auto; padding: 48px 56px; }

    /* Cover block */
    .cover {
      border-left: 5px solid var(--accent);
      padding: 24px 28px;
      margin-bottom: 40px;
      background: var(--accent-light);
      border-radius: 0 8px 8px 0;
    }
    .cover h1 {
      font-size: 1.9rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--fg);
      border: none;
      padding: 0;
      margin: 0 0 6px;
    }
    .cover .subtitle {
      font-size: 10pt;
      color: var(--muted);
      font-weight: 500;
    }

    h1 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 36px 0 14px;
      color: var(--fg);
      border-bottom: 3px solid var(--accent);
      padding-bottom: 10px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 32px 0 12px;
      color: var(--fg);
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 24px 0 10px;
      color: var(--fg);
      page-break-after: avoid;
    }
    h4 {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 18px 0 8px;
      color: var(--muted);
      page-break-after: avoid;
    }
    h5 {
      font-size: 0.88rem;
      font-weight: 700;
      margin: 14px 0 6px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    p { font-size: 10.5pt; margin: 0 0 10px; }
    li { font-size: 10.5pt; margin: 3px 0; }
    a { color: var(--accent); text-decoration: none; }

    blockquote {
      border-left: 3px solid var(--accent);
      padding: 8px 16px;
      margin: 12px 0;
      color: var(--muted);
      background: var(--accent-light);
      border-radius: 0 6px 6px 0;
    }
    blockquote p { font-size: 10pt; }

    code {
      background: var(--code-bg);
      border: 1px solid var(--border);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: "SF Mono", Menlo, Consolas, monospace;
      font-size: 0.86em;
      color: #be185d;
    }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 14px 18px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.5;
      font-family: "SF Mono", Menlo, Consolas, monospace;
      page-break-inside: avoid;
      margin: 10px 0 14px;
    }
    pre code {
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0 16px;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th, td {
      padding: 6px 10px;
      border: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tr:nth-child(even) td { background: var(--row-alt); }

    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 28px 0;
    }

    ul, ol { padding-left: 22px; margin: 6px 0 12px; }
    li { margin: 3px 0; }
    strong { font-weight: 700; color: var(--fg); }
    em { color: var(--muted); }

    /* US story card styling: h4 under h3 */
    h3 + p { margin-top: 4px; }

    /* Section dividers between epics */
    h2 { margin-top: 40px; }

    @page {
      margin: 18mm 18mm 24mm 18mm;
    }

    /* Page break helpers */
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
<main>
  <div class="cover">
    <h1>${title}</h1>
    <div class="subtitle">${subtitle}</div>
  </div>
  ${htmlBody}
</main>
</body>
</html>`;
}

// ── PDF generator ─────────────────────────────────────────────────────────────
async function generatePdf(doc, browser) {
  console.log(`\n📄 Generating: ${doc.output.split("/").pop()}`);

  const md = readFileSync(doc.input, "utf8");
  const htmlBody = marked.parse(md);
  const html = buildHtml(doc, htmlBody);

  const tmpPath = join(projectRoot, `docs/.${doc.key}.tmp.html`);
  writeFileSync(tmpPath, html);

  const page = await browser.newPage();
  await page.goto("file://" + tmpPath, { waitUntil: "networkidle0" });

  await page.pdf({
    path: doc.output,
    format: "A4",
    margin: { top: "18mm", right: "18mm", bottom: "24mm", left: "18mm" },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;padding:0 18mm;font-family:sans-serif;">
      <span style="float:left">${doc.title}</span>
    </div>`,
    footerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;padding:0 18mm;font-family:sans-serif;text-align:center;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>`,
  });

  await page.close();

  try { unlinkSync(tmpPath); } catch {}

  console.log(`   ✅ Saved: ${doc.output}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("⏳ Launching Chromium…");
const browser = await puppeteer.launch({ headless: "new" });

for (const doc of toGenerate) {
  await generatePdf(doc, browser);
}

await browser.close();
console.log("\n✅ All PDFs generated successfully.");
