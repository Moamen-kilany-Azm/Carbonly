const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, LevelFormat, UnderlineType
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN = 1080; // 0.75 inch
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 10080

const COLORS = {
  green: "16A34A",
  darkGray: "374151",
  medGray: "6B7280",
  lightGray: "F3F4F6",
  headerBg: "D1FAE5",
  border: "D1D5DB",
  white: "FFFFFF",
  accent: "15803D",
  tableHeader: "DCFCE7",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const border = (color = COLORS.border) => ({ style: BorderStyle.SINGLE, size: 4, color });
const cellBorders = (color) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });

function makeDoc(sections, title) {
  return new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22, color: COLORS.darkGray } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 40, bold: true, font: "Arial", color: COLORS.accent },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, font: "Arial", color: COLORS.green },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: COLORS.darkGray },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
        },
        {
          id: "Normal", name: "Normal", run: { font: "Arial", size: 22 },
          paragraph: { spacing: { after: 120, line: 276, lineRule: "auto" } },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 260 }, spacing: { after: 80 } } },
          }],
        },
        {
          reference: "check",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "\u2610", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 260 }, spacing: { after: 60 } } },
          }],
        },
        {
          reference: "numbered",
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 280 }, spacing: { after: 80 } } },
          }],
        },
      ],
    },
    sections,
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function para(children, opts = {}) {
  return new Paragraph({ children, spacing: { after: 120 }, ...opts });
}
function bullet(children) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, children });
}
function checkbox(children) {
  return new Paragraph({ numbering: { reference: "check", level: 0 }, children });
}
function numbered(children) {
  return new Paragraph({ numbering: { reference: "numbered", level: 0 }, children });
}
function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 60 } });
}
function bold(text) {
  return new TextRun({ text, bold: true, font: "Arial", size: 22 });
}
function normal(text) {
  return new TextRun({ text, font: "Arial", size: 22 });
}
function code(text) {
  return new TextRun({ text, font: "Courier New", size: 18, color: "374151" });
}
function italic(text) {
  return new TextRun({ text, italics: true, font: "Arial", size: 22 });
}

function divider() {
  return new Paragraph({
    children: [new TextRun("")],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border, space: 1 } },
    spacing: { before: 160, after: 160 },
  });
}

function makeCell(children, opts = {}) {
  const { bg, bold: isBold, width, borders: b } = opts;
  return new TableCell({
    width: { size: width || 2000, type: WidthType.DXA },
    borders: b || cellBorders(),
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: Array.isArray(children) ? children : [
      new Paragraph({
        children: [new TextRun({ text: children, font: "Arial", size: 20, bold: isBold || false })],
        spacing: { after: 0 },
      }),
    ],
  });
}

function headerRow(cols, widths) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((col, i) =>
      makeCell(col, { bg: COLORS.tableHeader, bold: true, width: widths[i] })
    ),
  });
}

function dataRow(cells, widths) {
  return new TableRow({
    children: cells.map((cell, i) => makeCell(cell, { width: widths[i] })),
  });
}

function makeTable(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      headerRow(headers, widths),
      ...rows.map(r => dataRow(r, widths)),
    ],
  });
}

function metaPara(label, value) {
  return para([bold(label + ": "), normal(value)]);
}

function pageProps() {
  return {
    page: {
      size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
      margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
    },
  };
}

function footer(docTitle) {
  return {
    default: new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: `Carbonly \u2014 ${docTitle}`, font: "Arial", size: 16, color: COLORS.medGray }),
            new TextRun({ text: "\t", font: "Arial", size: 16 }),
            new TextRun({ text: "Page ", font: "Arial", size: 16, color: COLORS.medGray }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: COLORS.medGray }),
          ],
          tabStops: [{ type: "right", position: CONTENT_WIDTH }],
          spacing: { after: 0 },
        }),
      ],
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRD DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
function buildBRD() {
  const children = [
    h1("Business Requirements Document (BRD)"),
    h2("Carbonly \u2014 Carbon Emissions Management SaaS"),
    metaPara("Version", "1.0"),
    metaPara("Date", "April 2026"),
    metaPara("Status", "Draft"),
    divider(),

    // 1. Executive Summary
    h2("1. Executive Summary"),
    para([normal(
      "Carbonly is a multi-tenant SaaS platform that enables organizations to measure, track, and report greenhouse gas (GHG) emissions across Scope 1, Scope 2, and Scope 3 as defined by the GHG Protocol Corporate Accounting and Reporting Standard. The platform provides a structured emissions calculator, an operational dashboard, and an admin configuration layer with subscription-based access control."
    )]),
    divider(),

    // 2. Business Objectives
    h2("2. Business Objectives"),
    makeTable(
      ["#", "Objective"],
      [
        ["BO-1", "Enable organizations to comply with GHG reporting requirements (TCFD, CDP, EU CSRD)"],
        ["BO-2", "Reduce the time required to compile annual emissions inventories from weeks to hours"],
        ["BO-3", "Generate recurring SaaS revenue through tiered subscription plans (Starter, Professional, Enterprise)"],
        ["BO-4", "Support multiple organizations (entities) on a single platform with strict data isolation"],
        ["BO-5", "Provide configurable emission factors aligned to DEFRA, EPA, GHG Protocol, and IPCC sources"],
      ],
      [900, 9180]
    ),
    spacer(), divider(),

    // 3. Scope
    h2("3. Scope"),
    h3("3.1 In Scope"),
    bullet([normal("Scope 1 emissions calculator (stationary combustion, mobile combustion, fugitive emissions)")]),
    bullet([normal("Scope 2 emissions calculator (purchased electricity, heat/steam \u2014 location-based method)")]),
    bullet([normal("Scope 3 emissions calculator (business travel, employee commuting, purchased goods, waste)")]),
    bullet([normal("Emissions dashboard with scope breakdown and monthly trends")]),
    bullet([normal("Emission records management (CRUD, manual entry)")]),
    bullet([normal("Admin panel: entity management, user management, scope/activity configuration, emission factor management, yearly configuration")]),
    bullet([normal("Subscription and payment management via Stripe")]),
    bullet([normal("Role-based access control: SUPER_ADMIN, ADMIN, EXPERT")]),
    bullet([normal("PDF/CSV report generation (per year, per scope)")]),
    bullet([normal("Multi-entity (multi-tenant) architecture")]),
    spacer(),
    h3("3.2 Out of Scope (Phase 1)"),
    bullet([normal("Automated data ingestion via IoT sensors or utility APIs")]),
    bullet([normal("Third-party ESG platform integrations (e.g. Salesforce, SAP)")]),
    bullet([normal("Market-based Scope 2 accounting (RECs, PPAs)")]),
    bullet([normal("Carbon offsetting marketplace")]),
    bullet([normal("Mobile application")]),
    spacer(), divider(),

    // 4. Stakeholders
    h2("4. Stakeholders"),
    makeTable(
      ["Stakeholder", "Role"],
      [
        ["Platform Owner", "Anthropic / Product Team \u2014 defines features and pricing"],
        ["SUPER_ADMIN", "Platform administrator \u2014 configures scopes, activities, emission factors"],
        ["Entity ADMIN", "Customer organization admin \u2014 manages users, yearly config, billing"],
        ["Carbon Expert (EXPERT)", "End user \u2014 enters activity data, runs calculations, views dashboard"],
        ["Finance Team", "Approves subscription and billing configuration"],
      ],
      [2500, 7580]
    ),
    spacer(), divider(),

    // 5. Functional Requirements
    h2("5. Functional Requirements"),

    h3("5.1 Authentication & Authorization"),
    makeTable(["ID", "Requirement"], [
      ["FR-AUTH-01", "Users must authenticate via email/password or Google OAuth"],
      ["FR-AUTH-02", "Sessions must expire after inactivity (configurable, default 30 days)"],
      ["FR-AUTH-03", "SUPER_ADMIN has access to the entire platform admin panel"],
      ["FR-AUTH-04", "Entity ADMIN can manage users and configuration within their entity"],
      ["FR-AUTH-05", "EXPERT can only access and create emission records within their assigned entity"],
      ["FR-AUTH-06", "Users not assigned to an entity must be redirected to an onboarding flow"],
    ], [1500, 8580]),
    spacer(),

    h3("5.2 Emissions Calculator"),
    makeTable(["ID", "Requirement"], [
      ["FR-CALC-01", "The system must provide calculators for Scope 1, 2, and 3"],
      ["FR-CALC-02", "Each calculator must allow selection of activity and emission factor"],
      ["FR-CALC-03", "Calculation formula: CO2e (kg) = quantity x emission factor value"],
      ["FR-CALC-04", "Results must be stored in both kg and tonnes CO2e"],
      ["FR-CALC-05", "Each record must capture: activity, emission factor, quantity, unit, period (month/year), notes"],
      ["FR-CALC-06", "Emission factors must show source, region, and GWP version"],
    ], [1500, 8580]),
    spacer(),

    h3("5.3 Dashboard"),
    makeTable(["ID", "Requirement"], [
      ["FR-DASH-01", "Display total CO2e by scope for the selected year"],
      ["FR-DASH-02", "Show scope breakdown as a donut/pie chart"],
      ["FR-DASH-03", "Show monthly emission trend as a bar chart"],
      ["FR-DASH-04", "List top 5 emission-contributing activities"],
      ["FR-DASH-05", "Allow year selection (current year default)"],
    ], [1500, 8580]),
    spacer(),

    h3("5.4 Admin \u2014 Entity Management"),
    makeTable(["ID", "Requirement"], [
      ["FR-ENT-01", "SUPER_ADMIN can create, view, update, and deactivate entities"],
      ["FR-ENT-02", "Each entity has a unique slug used for tenant routing"],
      ["FR-ENT-03", "Entity admin can update entity profile (name, industry, country, logo)"],
      ["FR-ENT-04", "Subscription status must reflect Stripe state in real time"],
    ], [1500, 8580]),
    spacer(),

    h3("5.5 Admin \u2014 User Management"),
    makeTable(["ID", "Requirement"], [
      ["FR-USR-01", "SUPER_ADMIN can view all users across all entities"],
      ["FR-USR-02", "Entity ADMIN can invite users to their entity by email"],
      ["FR-USR-03", "Entity ADMIN can change a user's EntityRole (ADMIN or EXPERT)"],
      ["FR-USR-04", "Deactivated users must not be able to log in"],
    ], [1500, 8580]),
    spacer(),

    h3("5.6 Admin \u2014 Scope & Activity Configuration"),
    makeTable(["ID", "Requirement"], [
      ["FR-SCOPE-01", "SUPER_ADMIN can create, update, and deactivate activities under each scope"],
      ["FR-SCOPE-02", "Each activity must have a name, unit, and equation description"],
      ["FR-SCOPE-03", "SUPER_ADMIN can add emission factors to activities with source, region, and GWP"],
      ["FR-SCOPE-04", "Entity ADMIN can create entity-specific emission factor overrides per yearly config"],
    ], [1500, 8580]),
    spacer(),

    h3("5.7 Yearly Configuration"),
    makeTable(["ID", "Requirement"], [
      ["FR-YEAR-01", "Each entity can have a yearly configuration per calendar year"],
      ["FR-YEAR-02", "One year can be designated as the baseline year"],
      ["FR-YEAR-03", "Yearly config anchors entity-specific emission factor overrides"],
    ], [1500, 8580]),
    spacer(),

    h3("5.8 Payment Module"),
    makeTable(["ID", "Requirement"], [
      ["FR-PAY-01", "Users can subscribe to Starter, Professional, or Enterprise plans"],
      ["FR-PAY-02", "Subscription is managed via Stripe Checkout"],
      ["FR-PAY-03", "Webhook must update entity subscription status on payment events"],
      ["FR-PAY-04", "Entities with PAST_DUE or CANCELED status must be redirected to the billing page"],
      ["FR-PAY-05", "Entity ADMIN can view billing history and manage payment methods via Stripe portal"],
    ], [1500, 8580]),
    spacer(),

    h3("5.9 Reporting"),
    makeTable(["ID", "Requirement"], [
      ["FR-RPT-01", "Users can generate a yearly emissions report per entity"],
      ["FR-RPT-02", "Reports must include total emissions, scope breakdown, and activity detail"],
      ["FR-RPT-03", "Reports can be exported as PDF and CSV"],
      ["FR-RPT-04", "Generated reports are stored with a status (DRAFT > GENERATED > PUBLISHED)"],
    ], [1500, 8580]),
    spacer(), divider(),

    // 6. Non-Functional Requirements
    h2("6. Non-Functional Requirements"),
    makeTable(["ID", "Requirement"], [
      ["NFR-01", "Security: All routes must be protected by session-based auth; tenant data isolation enforced at query level"],
      ["NFR-02", "Performance: Dashboard must render initial data server-side (RSC); no client-side data fetch on first load"],
      ["NFR-03", "Availability: Platform target 99.9% uptime (SLA for Enterprise plan)"],
      ["NFR-04", "Scalability: Multi-tenant shared schema; must support 500+ entities without schema changes"],
      ["NFR-05", "Auditability: All emission records must capture userId, dataSource, and createdAt"],
      ["NFR-06", "Compliance: Emission factor methodology must align to GHG Protocol; source and vintage (year) must be traceable"],
    ], [1500, 8580]),
    spacer(), divider(),

    // 7. Subscription Plans
    h2("7. Subscription Plans"),
    makeTable(
      ["Feature", "Starter", "Professional", "Enterprise"],
      [
        ["Users", "Up to 3", "Up to 10", "Unlimited"],
        ["Scopes", "1 & 2", "All (1, 2, 3)", "All"],
        ["Reports", "Basic CSV", "PDF + CSV", "Custom"],
        ["Support", "Email", "Priority email", "Dedicated CSM"],
        ["SLA", "\u2014", "\u2014", "99.9%"],
      ],
      [2520, 2520, 2520, 2520]
    ),
    spacer(), divider(),

    // 8. Assumptions & Constraints
    h2("8. Assumptions & Constraints"),
    bullet([normal("Phase 1 uses location-based Scope 2 methodology only")]),
    bullet([normal("Emission factors are maintained by the platform admin (not auto-updated from external sources in Phase 1)")]),
    bullet([normal("All monetary values are in USD")]),
    bullet([normal("The platform is deployed on Vercel with a serverless PostgreSQL database (Neon/Supabase)")]),
    spacer(), divider(),

    // 9. Glossary
    h2("9. Glossary"),
    makeTable(
      ["Term", "Definition"],
      [
        ["GHG", "Greenhouse Gas"],
        ["CO2e", "Carbon Dioxide equivalent \u2014 a standard unit for measuring carbon footprints"],
        ["Scope 1", "Direct emissions from owned/controlled sources"],
        ["Scope 2", "Indirect emissions from purchased energy"],
        ["Scope 3", "All other indirect emissions in the value chain"],
        ["EF", "Emission Factor \u2014 the CO2e emitted per unit of activity"],
        ["GWP", "Global Warming Potential \u2014 multiplier for converting non-CO2 gases to CO2e"],
        ["Entity", "A tenant organization on the Carbonly platform"],
        ["tCO2e", "Metric tonnes of CO2 equivalent"],
      ],
      [1800, 8280]
    ),
  ];

  return makeDoc([{
    properties: pageProps(),
    footers: footer("Business Requirements Document"),
    children,
  }], "BRD");
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER STORIES DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
function storyCard(id, title, asWho, iWant, soThat, criteria) {
  const paragraphs = [
    new Paragraph({
      children: [new TextRun({ text: `${id} \u00B7 ${title}`, bold: true, font: "Arial", size: 24, color: COLORS.accent })],
      spacing: { before: 200, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.border, space: 1 } },
    }),
    para([bold("As "), normal(asWho + ", "), bold("I want "), normal(iWant + " "), bold("so that "), normal(soThat + ".")]),
    spacer(),
    new Paragraph({
      children: [new TextRun({ text: "Acceptance Criteria:", bold: true, font: "Arial", size: 22 })],
      spacing: { after: 60 },
    }),
    ...criteria.map(c => checkbox([normal(c)])),
    spacer(),
  ];
  return paragraphs;
}

function buildUserStories() {
  const children = [
    h1("User Stories"),
    h2("Carbonly \u2014 Carbon Emissions Management SaaS"),
    divider(),

    // Personas
    h2("Personas"),
    para([bold("Adam (SUPER_ADMIN)"), normal(" \u2014 Platform administrator at Carbonly. Manages platform-wide configuration, onboards new client organizations, and maintains the emissions taxonomy.")]),
    para([bold("Emma (Entity ADMIN)"), normal(" \u2014 Sustainability manager at Acme Corp. Manages her organization\u2019s Carbonly account, invites team members, configures yearly baselines, and reviews billing.")]),
    para([bold("Carlos (Carbon Expert / EXPERT)"), normal(" \u2014 Environmental consultant at Acme Corp. Enters monthly activity data, runs emission calculations, and prepares reports for disclosure.")]),
    divider(),

    // Epic 1
    h2("Epic 1 \u2014 Authentication & Onboarding"),
    ...storyCard("US-001", "Sign In",
      "Carlos", "to sign in with my email and password", "I can access my organization\u2019s emission data securely",
      [
        "I can enter my email and password on the login page",
        "On successful login I am redirected to the dashboard",
        "On failed login I see \"Invalid email or password\" (no hint about which field is wrong)",
        "I can also sign in with Google",
      ]
    ),
    ...storyCard("US-002", "Register Account",
      "a new user invited by an Entity ADMIN", "to register with my name, email, and password", "I can access the platform",
      [
        "Registration requires name, email (unique), and password (min 8 characters)",
        "After registration I am redirected to the login page with a confirmation message",
        "Attempting to register with an existing email shows an error",
      ]
    ),
    ...storyCard("US-003", "Sign Out",
      "Carlos", "to sign out of the application", "my session is ended on shared devices",
      ["Clicking \"Sign out\" in the topbar ends my session and redirects to /login"]
    ),
    divider(),

    // Epic 2
    h2("Epic 2 \u2014 Dashboard"),
    ...storyCard("US-010", "View Emissions Overview",
      "Carlos", "to see a summary of my organization\u2019s total emissions for the current year", "I can quickly understand our carbon footprint at a glance",
      [
        "Dashboard shows total tCO2e for current year",
        "Separate summary cards for Scope 1, Scope 2, and Scope 3",
        "All data loads server-side (no loading spinner on initial visit)",
      ]
    ),
    ...storyCard("US-011", "View Scope Breakdown Chart",
      "Carlos", "to see a pie/donut chart showing the percentage split across Scope 1, 2, and 3", "I understand which scope drives the most emissions",
      [
        "Chart displays proportional CO2e per scope",
        "Hovering a segment shows the tCO2e value",
        "When no data exists the chart shows \"No data available\"",
      ]
    ),
    ...storyCard("US-012", "View Monthly Trend",
      "Emma", "to see a monthly bar chart of emissions", "I can identify seasonal patterns and anomalies",
      [
        "Bar chart shows 12 months (Jan\u2013Dec) for the selected year",
        "Bars show total tCO2e across all scopes per month",
        "Months with no records show a zero bar",
      ]
    ),
    ...storyCard("US-013", "Filter Dashboard by Year",
      "Emma", "to select a different year on the dashboard", "I can compare year-over-year performance",
      [
        "Year selector is available on the dashboard",
        "Changing year reloads all dashboard data for that year",
        "Default is the current calendar year",
      ]
    ),
    divider(),

    // Epic 3
    h2("Epic 3 \u2014 Emissions Calculator"),
    ...storyCard("US-020", "Calculate Scope 1 Emissions",
      "Carlos", "to enter a quantity of fuel consumed and have the system calculate the CO2e automatically", "I don\u2019t need to apply emission factors manually",
      [
        "I can select an activity (e.g. \"Stationary Combustion \u2014 Natural Gas\")",
        "I see the available emission factors with source and unit",
        "I enter a quantity and a reporting period (month/year)",
        "On submission the system calculates CO2e (kg and tonnes) and saves the record",
        "The result is displayed immediately on screen",
      ]
    ),
    ...storyCard("US-021", "Calculate Scope 2 Emissions",
      "Carlos", "to log monthly electricity consumption with the applicable grid emission factor", "our Scope 2 footprint is accurately recorded",
      [
        "Scope 2 calculator shows electricity and heat/steam activities",
        "I can select the appropriate regional grid factor (UK, US, EU)",
        "Record is saved with the selected factor preserved (immutable reference)",
      ]
    ),
    ...storyCard("US-022", "Calculate Scope 3 Emissions",
      "Carlos", "to record business travel, commuting, and waste data", "our full value chain footprint is captured",
      [
        "Scope 3 calculator lists all configured Scope 3 activities",
        "Each activity shows its unit (e.g. passenger-km, tonnes)",
        "I can add optional notes to any record",
      ]
    ),
    ...storyCard("US-023", "View All Emission Records",
      "Carlos", "to view a table of all emission records for my organization", "I can review and audit what has been entered",
      [
        "Table shows: date, scope, activity, quantity, CO2e, data source",
        "Records are sorted by date descending",
        "I can filter by year",
        "Pagination with 20 records per page",
      ]
    ),
    divider(),

    // Epic 4
    h2("Epic 4 \u2014 Reporting"),
    ...storyCard("US-030", "Generate Annual Report",
      "Emma", "to generate an annual emissions report for a given year", "I can submit it for internal review or external disclosure",
      [
        "I can trigger report generation for any year with existing records",
        "Report includes: total CO2e, scope breakdown table, activity breakdown, methodology notes",
        "Report is generated as a PDF",
        "Report status progresses: DRAFT > GENERATED > PUBLISHED",
      ]
    ),
    ...storyCard("US-031", "Export Records as CSV",
      "Carlos", "to download a CSV of all emission records for a year", "I can do further analysis in Excel",
      [
        "CSV includes all columns: date, scope, activity, quantity, unit, CO2e kg, CO2e t, factor, source",
        "File is named carbonly-emissions-{entity}-{year}.csv",
      ]
    ),
    divider(),

    // Epic 5
    h2("Epic 5 \u2014 Admin: Entity Management"),
    ...storyCard("US-040", "Create New Entity",
      "Adam (SUPER_ADMIN)", "to create a new entity for an onboarding customer", "their users can start using the platform",
      [
        "I can create an entity with name, slug (auto-generated, editable), industry, and country",
        "Slug must be URL-safe and unique",
        "A Stripe Customer record is created automatically on entity creation",
      ]
    ),
    ...storyCard("US-041", "View All Entities",
      "Adam", "to see a list of all entities with their subscription status, user count, and record count", "I can monitor platform usage",
      [
        "Table shows: name, slug, subscription status (badge), user count, record count, created date",
        "Subscription status uses color-coded badges (ACTIVE = green, TRIALING = blue, PAST_DUE/CANCELED = red)",
      ]
    ),
    divider(),

    // Epic 6
    h2("Epic 6 \u2014 Admin: User Management"),
    ...storyCard("US-050", "View All Users",
      "Adam", "to see a list of all registered users with their entity and role", "I can audit access across the platform",
      [
        "Table shows: name, email, global role, entity membership, join date",
        "Global role uses color-coded badges",
      ]
    ),
    ...storyCard("US-051", "Invite User to Entity",
      "Emma (Entity ADMIN)", "to invite a new user to my organization by email", "they can log in and start entering data",
      [
        "I can enter an email address; the system sends an invitation email",
        "The invited user must register if they don\u2019t have an account",
        "The user is automatically assigned to my entity with role EXPERT",
      ]
    ),
    divider(),

    // Epic 7
    h2("Epic 7 \u2014 Admin: Scope & Activity Configuration"),
    ...storyCard("US-060", "Manage Activities",
      "Adam", "to add, edit, or deactivate activities under each scope", "the calculator reflects current reporting requirements",
      [
        "I can add a new activity with name, unit, and equation description",
        "I can deactivate an activity without deleting historical records",
        "Inactive activities do not appear in the calculator",
      ]
    ),
    ...storyCard("US-061", "Manage Emission Factors",
      "Adam", "to add new emission factors to activities", "users have access to the latest DEFRA/EPA values",
      [
        "Each factor requires: name, value (kgCO2e/unit), unit, source, region, GWP",
        "I can mark a factor as the default for its activity",
        "Historical records retain their factor reference permanently",
      ]
    ),
    divider(),

    // Epic 8
    h2("Epic 8 \u2014 Yearly Configuration"),
    ...storyCard("US-070", "Set Baseline Year",
      "Emma", "to designate a year as our GHG baseline", "it is clearly marked in reports and comparisons",
      [
        "Only one year per entity can be the baseline year",
        "Setting a new baseline year deselects the previous one",
        "The baseline year is highlighted in the dashboard year selector",
      ]
    ),
    divider(),

    // Epic 9
    h2("Epic 9 \u2014 Payment & Billing"),
    ...storyCard("US-080", "Subscribe to a Plan",
      "Emma", "to subscribe to the Professional plan", "my team can access all three scopes and generate PDF reports",
      [
        "I am redirected to Stripe Checkout to complete payment",
        "On success my entity\u2019s subscription status changes to ACTIVE immediately",
        "I receive a confirmation email from Stripe",
      ]
    ),
    ...storyCard("US-081", "Manage Billing",
      "Emma", "to view my invoices and update my payment method", "I can keep the account in good standing",
      [
        "Clicking \"Manage Billing\" opens the Stripe Customer Portal",
        "I can download past invoices and update payment method",
      ]
    ),
    ...storyCard("US-082", "Access Restriction on Lapsed Subscription",
      "Carlos", "to see a clear message explaining the situation when my organization\u2019s subscription lapses", "I know what to do to restore access",
      [
        "Users from a PAST_DUE or CANCELED entity are redirected to the billing page",
        "The billing page shows the subscription status and a \"Reactivate\" button",
      ]
    ),
  ];

  return makeDoc([{
    properties: pageProps(),
    footers: footer("User Stories"),
    children,
  }], "User Stories");
}

// ═══════════════════════════════════════════════════════════════════════════════
// TECHNICAL ARCHITECTURE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
function codeBlock(lines) {
  return lines.map(line =>
    new Paragraph({
      children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "374151" })],
      spacing: { after: 0, before: 0 },
      indent: { left: 360 },
    })
  );
}

function buildTechArch() {
  const children = [
    h1("Technical Architecture"),
    h2("Carbonly \u2014 Carbon Emissions Management SaaS"),
    divider(),

    // 1. Tech Stack
    h2("1. Technology Stack"),
    makeTable(
      ["Layer", "Technology", "Rationale"],
      [
        ["Framework", "Next.js 16 (App Router)", "RSC for server-rendered dashboard; file-based routing; built-in API routes"],
        ["Language", "TypeScript", "End-to-end type safety via shared Zod schemas and Prisma types"],
        ["Styling", "Tailwind CSS v4", "Utility-first; fast iteration; no CSS bundle bloat"],
        ["UI Components", "Radix UI primitives", "Accessible, unstyled headless components wired to Tailwind"],
        ["ORM", "Prisma v7", "Type-safe DB client; migration tooling; Prisma Studio for admin"],
        ["Database", "PostgreSQL (Neon/Supabase)", "Serverless-compatible; full JSONB support for report summaries"],
        ["Auth", "NextAuth v5 (Auth.js)", "JWT strategy; Prisma adapter; credentials + Google OAuth"],
        ["Payments", "Stripe", "Hosted checkout; webhooks for subscription state sync"],
        ["Charts", "Recharts", "React-native; composable; SSR-safe with client boundaries"],
        ["Validation", "Zod", "Shared between API route inputs and React Hook Form resolvers"],
        ["Forms", "React Hook Form", "Performant; integrates with Zod via @hookform/resolvers"],
        ["State", "Zustand", "Lightweight client state only (e.g. calculator draft)"],
        ["Deployment", "Vercel", "Zero-config Next.js deployment; edge middleware support"],
      ],
      [1800, 2400, 5880]
    ),
    spacer(), divider(),

    // 2. Architecture Diagram
    h2("2. System Architecture Diagram"),
    para([normal("The following diagram describes the high-level system architecture:")]),
    spacer(),
    ...codeBlock([
      "BROWSER",
      "  \u251C\u2500 Auth Pages (/login, /register)",
      "  \u251C\u2500 Dashboard RSC (/dashboard, /scope/[1|2|3])",
      "  \u2514\u2500 Admin Panel (/admin/**)",
      "         \u2502 HTTPS",
      "NEXT.JS SERVER (Vercel)",
      "  \u251C\u2500 middleware.ts \u2014 auth check + role guard + tenant context",
      "  \u251C\u2500 React Server Components (RSC)",
      "  \u2502    \u2514\u2500 Fetch via Prisma directly (no HTTP round-trip)",
      "  \u2514\u2500 API Routes",
      "       \u251C\u2500 POST /api/emissions    \u2014 create record + calculate",
      "       \u251C\u2500 GET  /api/emissions    \u2014 list records",
      "       \u251C\u2500 POST /api/auth/register",
      "       \u2514\u2500 POST /api/webhooks/stripe",
      "         \u2502",
      "    \u250C\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
      "    \u2502            \u2502",
      " PostgreSQL        Stripe",
      " (Neon/Supabase)   - Checkout",
      " - Prisma ORM      - Webhooks",
      " - Shared schema   - Customer Portal",
      " - Row isolation",
      "   via entityId",
    ]),
    spacer(), divider(),

    // 3. Database Schema
    h2("3. Database Schema Overview"),
    ...codeBlock([
      "Entity (tenant)",
      "  \u251C\u2500 UserEntity (M:M join, adds EntityRole)",
      "  \u2502    \u2514\u2500 User (auth, globalRole)",
      "  \u251C\u2500 YearlyConfig (per year, anchors EF overrides)",
      "  \u251C\u2500 EmissionRecord (the core fact table)",
      "  \u2502    \u251C\u2500 Activity \u25B6 Scope (1, 2, 3)",
      "  \u2502    \u2514\u2500 EmissionFactor (versioned, source-tagged)",
      "  \u2514\u2500 Report (generated summaries)",
    ]),
    spacer(),
    para([bold("Indexing strategy:")]),
    bullet([code("EmissionRecord(entityId, year)"), normal(" \u2014 primary filter for all dashboard queries")]),
    bullet([code("EmissionRecord(entityId, activityId)"), normal(" \u2014 for activity-level aggregations")]),
    bullet([code("EmissionFactor(activityId)"), normal(" \u2014 for factor lookup in calculator")]),
    spacer(), divider(),

    // 4. Multi-Tenancy
    h2("4. Multi-Tenancy"),
    para([bold("Pattern:"), normal(" Shared database, shared schema with "), code("entityId"), normal(" discriminator.")]),
    spacer(),
    para([bold("Isolation layers:")]),
    numbered([bold("Middleware"), normal(" (src/middleware.ts) \u2014 reads JWT; blocks unauthenticated requests; checks globalRole for admin routes")]),
    numbered([bold("Layout guards"), normal(" \u2014 server-side redirect() if session lacks entityId or required role")]),
    numbered([bold("Data layer"), normal(" \u2014 every Prisma query for tenant-scoped data includes where: { entityId: session.user.entityId }. No exceptions.")]),
    spacer(),
    para([normal("The "), code("entityId"), normal(" and "), code("entityRole"), normal(" are embedded in the JWT at login and refreshed on every token rotation from the UserEntity table.")]),
    spacer(), divider(),

    // 5. Auth Flow
    h2("5. Authentication Flow"),
    ...codeBlock([
      "User submits credentials",
      "  \u2502",
      "  \u25BC",
      "CredentialsProvider.authorize()",
      "  \u2514\u2500 Hash-compare password with bcryptjs",
      "  \u2502",
      "  \u25BC",
      "jwt() callback",
      "  \u2514\u2500 Attach globalRole, entityId, entitySlug, entityRole from DB",
      "  \u2502",
      "  \u25BC",
      "session() callback",
      "  \u2514\u2500 Forward custom fields to Session object",
      "  \u2502",
      "  \u25BC",
      "Client receives typed Session",
      "  \u2514\u2500 session.user.{ id, globalRole, entityId, entitySlug, entityRole }",
    ]),
    spacer(), divider(),

    // 6. Calculation Engine
    h2("6. Calculation Engine"),
    para([normal("Location: "), code("src/lib/calculator/engine.ts")]),
    para([normal("The engine is a "), bold("pure function module"), normal(" \u2014 no imports from Prisma, no HTTP calls.")]),
    spacer(),
    para([bold("Formula (GHG Protocol):")]),
    ...codeBlock([
      "CO2e (kg) = Activity Data (unit) x Emission Factor (kgCO2e / unit)",
      "CO2e (t)  = CO2e (kg) / 1000",
    ]),
    spacer(),
    para([normal("All scope-specific functions (calculateScope1, calculateScope2, calculateScope3) delegate to the same calculate() base. Scope differentiation is handled by the emission factor selection, not by distinct formulas, in line with GHG Protocol methodology.")]),
    para([bold("Testing:"), normal(" The engine is independently testable with Vitest \u2014 no test database or mocking needed.")]),
    spacer(), divider(),

    // 7. API Design
    h2("7. API Design"),
    para([normal("All mutations use "), bold("Next.js API Routes"), normal(" for external callability (webhooks, future integrations).")]),
    spacer(),
    makeTable(
      ["Method", "Path", "Auth", "Description"],
      [
        ["POST", "/api/auth/register", "Public", "Create user account"],
        ["GET", "/api/auth/[...nextauth]", "\u2014", "NextAuth handler"],
        ["POST", "/api/auth/[...nextauth]", "\u2014", "NextAuth handler"],
        ["GET", "/api/emissions?year=", "EXPERT", "List records for entity"],
        ["POST", "/api/emissions", "EXPERT", "Create + calculate record"],
        ["DELETE", "/api/emissions/[id]", "EXPERT", "Delete record"],
        ["POST", "/api/webhooks/stripe", "Stripe sig", "Handle subscription events"],
      ],
      [900, 2800, 1400, 5080]
    ),
    spacer(),
    para([bold("Request/response contract:"), normal(" Zod schemas in src/lib/validations/ define the contract. The same schema is used by both the API route (server-side parse) and React Hook Form (client-side validation).")]),
    spacer(), divider(),

    // 8. Stripe Integration
    h2("8. Stripe Integration"),
    ...codeBlock([
      "Entity created",
      "  \u2514\u2500 Stripe Customer created \u2192 stripeCustomerId stored on Entity",
      "",
      "User clicks \"Subscribe\"",
      "  \u2514\u2500 Redirect to Stripe Checkout (hosted page)",
      "       \u2502 success",
      "       \u25BC",
      "Stripe fires customer.subscription.created webhook",
      "  \u2514\u2500 /api/webhooks/stripe verifies signature",
      "  \u2514\u2500 Updates Entity: subscriptionStatus, stripeSubscriptionId, stripePriceId",
      "",
      "Payment fails",
      "  \u2514\u2500 Stripe fires invoice.payment_failed",
      "  \u2514\u2500 Entity status \u2192 PAST_DUE \u2192 user redirected to billing page",
      "",
      "Subscription cancelled",
      "  \u2514\u2500 Entity status \u2192 CANCELED \u2192 access blocked",
    ]),
    spacer(),
    para([normal("The webhook is the "), bold("only"), normal(" place subscription status is updated. Never trust client-side Stripe redirect alone.")]),
    spacer(), divider(),

    // 9. Emission Factor Versioning
    h2("9. Emission Factor Versioning"),
    para([normal("Emission factors change annually (DEFRA, EPA publish new values each year). The resolution order when creating a record:")]),
    numbered([bold("Entity-year override"), normal(" \u2014 EmissionFactor linked to YearlyConfig for the entity\u2019s current year")]),
    numbered([bold("Global default for year"), normal(" \u2014 EmissionFactor.isDefault = true with no yearlyConfigId")]),
    numbered([bold("Latest global default"), normal(" \u2014 fallback to most recently added default factor for the activity")]),
    spacer(),
    para([normal("Once an EmissionRecord is created, it stores "), code("emissionFactorId"), normal(" as an immutable reference. Historical records always reflect the factor used at time of entry.")]),
    spacer(), divider(),

    // 10. Dashboard Data Strategy
    h2("10. Dashboard Data Strategy"),
    para([normal("The dashboard page is a "), bold("React Server Component"), normal(" that calls Prisma directly:")]),
    ...codeBlock([
      "// Server-side aggregation (no client fetch)",
      "const records = await prisma.emissionRecord.findMany({",
      "  where: { entityId, year },",
      "  include: { activity: { include: { scope: true } } }",
      "});",
      "",
      "// Aggregate in-memory for the current year's dataset",
      "const byScope = records.reduce(...);",
      "const byMonth = Array.from({ length: 12 }, ...);",
    ]),
    spacer(),
    para([normal("Chart components (ScopeBreakdownChart, MonthlyTrendChart) are \"use client\" components that receive pre-aggregated data as props. No client-side fetching on initial render.")]),
    para([normal("Year filter changes trigger a Next.js navigation with updated searchParams, re-running the RSC.")]),
    spacer(), divider(),

    // 11. Security
    h2("11. Security Considerations"),
    makeTable(
      ["Risk", "Mitigation"],
      [
        ["IDOR (accessing another tenant's data)", "All queries filtered by entityId from session; enforced at DB query level"],
        ["Privilege escalation", "globalRole stored in DB, embedded in JWT, checked in middleware AND layouts"],
        ["Stripe webhook spoofing", "Signature verified with stripe.webhooks.constructEvent() before any DB writes"],
        ["Password storage", "bcryptjs with cost factor 10 (approx. 100ms hash time)"],
        ["SQL injection", "Prisma parameterizes all queries \u2014 no raw SQL in application code"],
        ["XSS", "React\u2019s default JSX escaping; no dangerouslySetInnerHTML in application code"],
      ],
      [3200, 6880]
    ),
    spacer(), divider(),

    // 12. File Structure
    h2("12. File Structure Reference"),
    ...codeBlock([
      "src/",
      "\u251C\u2500\u2500 app/",
      "\u2502   \u251C\u2500\u2500 (auth)/          # login, register \u2014 no sidebar",
      "\u2502   \u251C\u2500\u2500 (dashboard)/     # main app \u2014 sidebar layout, entity-scoped",
      "\u2502   \u2502   \u251C\u2500\u2500 dashboard/   # overview page (RSC)",
      "\u2502   \u2502   \u251C\u2500\u2500 scope/[n]/   # calculator for scope 1, 2, 3",
      "\u2502   \u2502   \u251C\u2500\u2500 emissions/   # records list",
      "\u2502   \u2502   \u2514\u2500\u2500 reports/",
      "\u2502   \u251C\u2500\u2500 (admin)/         # platform admin \u2014 SUPER_ADMIN only",
      "\u2502   \u2502   \u2514\u2500\u2500 admin/",
      "\u2502   \u2502       \u251C\u2500\u2500 entities/",
      "\u2502   \u2502       \u251C\u2500\u2500 users/",
      "\u2502   \u2502       \u251C\u2500\u2500 scopes/",
      "\u2502   \u2502       \u251C\u2500\u2500 emission-factors/",
      "\u2502   \u2502       \u2514\u2500\u2500 billing/",
      "\u2502   \u2514\u2500\u2500 api/",
      "\u2502       \u251C\u2500\u2500 auth/        # NextAuth + registration",
      "\u2502       \u251C\u2500\u2500 emissions/   # CRUD + calculation",
      "\u2502       \u2514\u2500\u2500 webhooks/stripe/",
      "\u251C\u2500\u2500 components/",
      "\u2502   \u251C\u2500\u2500 auth/            # LoginForm, RegisterForm (client)",
      "\u2502   \u251C\u2500\u2500 layout/          # Sidebar, AdminSidebar, Topbar",
      "\u2502   \u251C\u2500\u2500 dashboard/       # Charts and summary cards (client)",
      "\u2502   \u2514\u2500\u2500 calculator/      # ScopeCalculator form (client)",
      "\u251C\u2500\u2500 lib/",
      "\u2502   \u251C\u2500\u2500 auth/auth.ts     # NextAuth config",
      "\u2502   \u251C\u2500\u2500 calculator/      # Pure calculation engine",
      "\u2502   \u251C\u2500\u2500 db/prisma.ts     # Prisma singleton",
      "\u2502   \u251C\u2500\u2500 stripe/          # Stripe client + plan config",
      "\u2502   \u251C\u2500\u2500 utils/format.ts  # CO2e formatting helpers",
      "\u2502   \u2514\u2500\u2500 validations/     # Zod schemas",
      "\u251C\u2500\u2500 middleware.ts        # Route guards + tenant context",
      "\u2514\u2500\u2500 types/next-auth.d.ts # Extended Session type",
      "prisma/",
      "\u251C\u2500\u2500 schema.prisma        # Full data model",
      "\u2514\u2500\u2500 seed.ts              # Demo data (scopes, activities, EFs, users)",
    ]),
    spacer(), divider(),

    // 13. Dev Setup
    h2("13. Development Setup"),
    ...codeBlock([
      "# 1. Install dependencies",
      "npm install",
      "",
      "# 2. Configure environment",
      "cp .env.local.example .env.local",
      "# Fill in DATABASE_URL, NEXTAUTH_SECRET, STRIPE_* keys",
      "",
      "# 3. Run database migrations",
      "npm run db:migrate",
      "",
      "# 4. Generate Prisma client",
      "npm run db:generate",
      "",
      "# 5. Seed demo data",
      "npm run db:seed",
      "",
      "# 6. Start development server",
      "npm run dev",
    ]),
    spacer(),
    para([bold("Demo credentials after seeding:")]),
    bullet([normal("Admin: admin@carbonly.io / admin1234")]),
    bullet([normal("Expert: expert@acme-corp.com / expert1234")]),
  ];

  return makeDoc([{
    properties: pageProps(),
    footers: footer("Technical Architecture"),
    children,
  }], "Technical Architecture");
}

// ═══════════════════════════════════════════════════════════════════════════════
// Generate all three
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  const docsDir = path.join(__dirname);

  const files = [
    { name: "BRD.docx", doc: buildBRD() },
    { name: "USER_STORIES.docx", doc: buildUserStories() },
    { name: "TECHNICAL_ARCHITECTURE.docx", doc: buildTechArch() },
  ];

  for (const { name, doc } of files) {
    const buf = await Packer.toBuffer(doc);
    const outPath = path.join(docsDir, name);
    fs.writeFileSync(outPath, buf);
    console.log(`Created: ${outPath}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
