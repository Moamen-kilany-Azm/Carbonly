/**
 * Generates a PDF from docs/ARCHITECTURE.md with fully rendered Mermaid diagrams.
 * Uses headless Chromium (via Puppeteer) + Mermaid.js CDN.
 *
 * Usage: node scripts/generate-architecture-pdf.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const input = join(projectRoot, "docs/ARCHITECTURE.md");
const output = join(projectRoot, "docs/Carbonly-Architecture.pdf");

// Configure marked to emit <pre class="mermaid"> for mermaid code fences
marked.use({
  renderer: {
    code(code, lang) {
      // marked v12+ passes an object; older versions pass strings
      const rawCode = typeof code === "object" ? code.text : code;
      const language = typeof code === "object" ? code.lang : lang;
      if (language === "mermaid") {
        return `<pre class="mermaid">${rawCode}</pre>`;
      }
      const escaped = rawCode
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre><code class="language-${language ?? ""}">${escaped}</code></pre>`;
    },
  },
});

const md = readFileSync(input, "utf8");
const htmlBody = marked.parse(md);

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Carbonly — Technical Architecture</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    :root {
      --fg: #0f172a;
      --muted: #475569;
      --accent: #16a34a;
      --border: #e2e8f0;
      --bg: #ffffff;
      --code-bg: #f8fafc;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
      font-size: 11pt;
      line-height: 1.55;
    }
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 56px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0 0 16px;
      color: var(--fg);
      border-bottom: 3px solid var(--accent);
      padding-bottom: 12px;
    }
    h2 {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 36px 0 14px;
      color: var(--fg);
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 26px 0 10px;
      color: var(--fg);
      page-break-after: avoid;
    }
    h4 {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 20px 0 8px;
      color: var(--muted);
      page-break-after: avoid;
    }
    p, li { font-size: 10.5pt; }
    a { color: var(--accent); text-decoration: none; }
    blockquote {
      border-left: 3px solid var(--accent);
      padding: 4px 16px;
      margin: 12px 0;
      color: var(--muted);
      background: #f0fdf4;
      border-radius: 0 6px 6px 0;
    }
    code {
      background: var(--code-bg);
      border: 1px solid var(--border);
      padding: 1px 5px;
      border-radius: 3px;
      font-family: "SF Mono", Menlo, Consolas, monospace;
      font-size: 0.87em;
      color: #be185d;
    }
    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 14px 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.45;
      font-family: "SF Mono", Menlo, Consolas, monospace;
      page-break-inside: avoid;
    }
    pre code {
      background: transparent;
      border: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }
    pre.mermaid {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid var(--border);
      padding: 20px;
      text-align: center;
      page-break-inside: avoid;
      font-size: 12pt;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0 16px;
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
    tr:nth-child(even) td { background: #fafafa; }
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 32px 0;
    }
    ul, ol { padding-left: 22px; margin: 8px 0 14px; }
    li { margin: 3px 0; }
    strong { font-weight: 700; color: var(--fg); }
    em { color: var(--muted); }
    /* Mermaid diagram tweaks */
    pre.mermaid svg { max-width: 100%; height: auto; }
    @page { margin: 20mm; }
  </style>
</head>
<body>
  <main>${htmlBody}</main>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      themeVariables: {
        primaryColor: "#dcfce7",
        primaryTextColor: "#0f172a",
        primaryBorderColor: "#16a34a",
        lineColor: "#475569",
        secondaryColor: "#dbeafe",
        tertiaryColor: "#fef3c7",
        fontFamily: '-apple-system, "Inter", sans-serif',
        fontSize: "14px",
      },
      flowchart: { htmlLabels: true, curve: "basis" },
      sequence: { actorMargin: 60, noteMargin: 10 },
      er: { fontSize: 12 },
    });
    window.mermaidRenderComplete = false;
    mermaid.run().then(() => { window.mermaidRenderComplete = true; });
  </script>
</body>
</html>`;

// Write intermediate HTML for debugging
const tmpHtml = join(projectRoot, "docs/.architecture.tmp.html");
writeFileSync(tmpHtml, html);

console.log("⏳ Launching Chromium…");
const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();

console.log("⏳ Loading HTML…");
await page.goto("file://" + tmpHtml, { waitUntil: "networkidle0" });

console.log("⏳ Waiting for Mermaid to render diagrams…");
await page.waitForFunction(
  () => window.mermaidRenderComplete === true,
  { timeout: 60000 }
);

// Give diagrams a moment to finish laying out
await new Promise((r) => setTimeout(r, 1000));

console.log("⏳ Generating PDF…");
await page.pdf({
  path: output,
  format: "A4",
  margin: { top: "20mm", right: "20mm", bottom: "25mm", left: "20mm" },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;padding:0 20mm;"><span style="float:left">Carbonly — Technical Architecture</span></div>`,
  footerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;padding:0 20mm;text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
});

await browser.close();

// Clean up intermediate HTML
import { unlinkSync } from "node:fs";
try { unlinkSync(tmpHtml); } catch {}

console.log(`✅ PDF generated: ${output}`);
