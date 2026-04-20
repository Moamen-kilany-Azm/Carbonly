# Carbonly — User Stories & Acceptance Criteria

> **Version:** 2.0
> **Last updated:** 2026-04-15
> **Status:** Active development
> **Format:** Agile user stories with INVEST principles · Given / When / Then acceptance criteria

This document captures every user-facing behaviour in the Carbonly platform. Each story follows the standard template (**As a**, **I want**, **So that**), is sized to fit in a single sprint, and is paired with explicit **validation rules**, **business rules**, **acceptance criteria**, and **edge cases**.

---

## Table of Contents

1. [Personas](#1-personas)
2. [Story conventions](#2-story-conventions)
3. [Epic 1 — Authentication & Account Management](#3-epic-1--authentication--account-management)
4. [Epic 2 — Onboarding & Workspace Navigation](#4-epic-2--onboarding--workspace-navigation)
5. [Epic 3 — Emissions Dashboard](#5-epic-3--emissions-dashboard)
6. [Epic 4 — Emissions Calculator (Scopes 1–3)](#6-epic-4--emissions-calculator-scopes-1-3)
7. [Epic 5 — Emission Records Management](#7-epic-5--emission-records-management)
8. [Epic 6 — Reporting](#8-epic-6--reporting)
9. [Epic 7 — Settings & Profile](#9-epic-7--settings--profile)
10. [Epic 8 — Billing & Subscriptions](#10-epic-8--billing--subscriptions)
11. [Epic 9 — Admin: Entity Management](#11-epic-9--admin-entity-management)
12. [Epic 10 — Admin: User Management](#12-epic-10--admin-user-management)
13. [Epic 11 — Admin: Taxonomy Management](#13-epic-11--admin-taxonomy-management)
14. [Epic 12 — Admin: Emission Factor Management](#14-epic-12--admin-emission-factor-management)
15. [Epic 13 — Admin: Platform Analytics & Billing Insights](#15-epic-13--admin-platform-analytics--billing-insights)
16. [Epic 14 — Marketing & Landing Page](#16-epic-14--marketing--landing-page)
17. [Cross-cutting acceptance criteria](#17-cross-cutting-acceptance-criteria)
18. [Traceability matrix](#18-traceability-matrix)

---

## 1. Personas

### 🧑‍💼 Adam — Platform Super Admin
- **Role:** `SUPER_ADMIN`
- **Context:** Works at Carbonly, owns the platform taxonomy and tenant lifecycle
- **Goals:** Onboard customers, maintain emission factors, monitor platform revenue
- **Tools used:** `/admin/*` routes, Stripe dashboard, Prisma Studio (ops)

### 🧑‍💼 Emma — Entity Administrator (Customer side)
- **Role:** `ADMIN` within an Entity (optionally `EXPERT` globalRole)
- **Context:** Head of Sustainability at Acme Corp
- **Goals:** Manage team members, configure yearly baseline, approve billing, publish annual reports
- **Tools used:** Dashboard, Reports, Settings (billing section)

### 👷 Carlos — Carbon Expert
- **Role:** `EXPERT`
- **Context:** Environmental consultant embedded at Acme Corp
- **Goals:** Enter monthly activity data, run calculations, verify numbers before reporting
- **Tools used:** Scope 1/2/3 calculators, emissions records table, dashboard

### 👤 Priya — Visitor / Prospect
- **Role:** Unauthenticated
- **Context:** Visits carbonly.io after seeing an ad
- **Goals:** Understand what the product does and whether to sign up
- **Tools used:** Landing page, pricing section, register flow

---

## 2. Story conventions

Each story has the following structure:

- **ID** — unique identifier (e.g. `US-001`)
- **Title** — short imperative description
- **As a** / **I want** / **So that** — classic user-story framing
- **Persona** — primary actor
- **Priority** — Must / Should / Could / Won't (MoSCoW)
- **Story points** — Fibonacci estimate (1, 2, 3, 5, 8, 13)
- **Dependencies** — other stories that must ship first
- **Validations** — input rules enforced by the UI, API, and/or database
- **Business rules** — non-validation rules driven by domain requirements
- **Acceptance criteria** — Given / When / Then scenarios that must pass
- **Edge cases** — unusual paths that must be handled

### Priority legend

| Priority | Meaning |
|---|---|
| **Must** | Required for MVP release |
| **Should** | Important but can ship in a follow-up |
| **Could** | Nice-to-have, ships when time allows |
| **Won't** | Explicitly deferred |

---

## 3. Epic 1 — Authentication & Account Management

**Goal:** Allow users to securely access the platform and manage their credentials.

---

### US-001 · Register a new account

**As a** visitor
**I want** to create a Carbonly account with my name, email, and password
**So that** I can sign in and use the platform

- **Persona:** Priya
- **Priority:** Must
- **Story points:** 3
- **Dependencies:** None

#### Validations
| Field | Rule |
|---|---|
| Full name | Required · 2–80 chars · letters, spaces, hyphens, apostrophes |
| Email | Required · valid RFC 5322 format · unique across `User.email` |
| Password | Required · min 8 chars · must contain at least one letter and one digit |
| Confirm password | Must equal `password` field |

#### Business rules
- Password is stored as a **bcryptjs hash** (cost factor 10). Plain text is never persisted.
- The email comparison is **case-insensitive** (lowercased on both write and read).
- On successful registration, no session is created — the user is redirected to `/login` to sign in explicitly.
- Duplicate-email attempts return `409 Conflict` with error `"Email already registered"`.

#### Acceptance criteria
1. **Given** I am on `/register`
   **When** I submit valid name, email, and password
   **Then** a `User` row is created, I see a success message, and I'm redirected to `/login?registered=1`.
2. **Given** the email `existing@example.com` already exists
   **When** I submit the form with that email
   **Then** I see the error "Email already registered" and no new user is created.
3. **Given** my password is `abc`
   **When** I submit the form
   **Then** I see "Password must be at least 8 characters".
4. **Given** I have JavaScript disabled
   **When** I submit the form
   **Then** server-side validation still runs and the same errors surface.

#### Edge cases
- Whitespace-only name is rejected.
- Trailing whitespace on email is trimmed before saving.
- Unicode names (e.g. `Ayşe Yılmaz`) are accepted.
- Passwords longer than 72 bytes are accepted but bcrypt only hashes the first 72 bytes (documented limitation).

---

### US-002 · Sign in with email and password

**As a** registered user
**I want** to sign in with my email and password
**So that** I can access my organisation's data

- **Persona:** Carlos
- **Priority:** Must
- **Story points:** 3
- **Dependencies:** US-001

#### Validations
| Field | Rule |
|---|---|
| Email | Required · valid format |
| Password | Required · 1+ chars |

#### Business rules
- Authentication handled by **NextAuth v5 CredentialsProvider**.
- Password comparison uses `bcrypt.compare()`.
- Failed attempts return a **generic error** (`"Invalid email or password"`) to prevent enumeration.
- Successful sign-in issues a **JWT session cookie** (HttpOnly, SameSite=Lax, signed with `NEXTAUTH_SECRET`).
- JWT contains `{ sub, globalRole, entityId, entitySlug, entityRole }`.

#### Acceptance criteria
1. **Given** valid credentials
   **When** I submit the login form
   **Then** a session cookie is set and I'm redirected to `/dashboard`.
2. **Given** a wrong password
   **When** I submit
   **Then** I see "Invalid email or password" and no cookie is set.
3. **Given** an email that doesn't exist
   **When** I submit
   **Then** I see the same generic error (no account enumeration).
4. **Given** I'm already signed in
   **When** I visit `/login`
   **Then** I'm redirected to `/dashboard` (no re-login prompt).

---

### US-003 · Sign in with Google

**As a** registered user
**I want** to sign in with my Google account
**So that** I don't need to remember another password

- **Persona:** Emma
- **Priority:** Should
- **Story points:** 2
- **Dependencies:** US-001, `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` configured

#### Business rules
- Google OAuth uses the **Authorization Code flow** via NextAuth's `GoogleProvider`.
- On first sign-in, a `User` + `Account` row is created by `PrismaAdapter`.
- The user's Google profile name and image are imported; password remains null.

#### Acceptance criteria
1. **Given** I click "Sign in with Google"
   **When** I complete Google's consent screen
   **Then** a `User` is created or matched by email, and I'm redirected to `/dashboard`.
2. **Given** my email is already registered via credentials
   **When** I sign in with Google using the same email
   **Then** a new `Account` row links Google to my existing user (no duplicate `User`).

---

### US-004 · Sign out

**As a** signed-in user
**I want** to sign out
**So that** my session is terminated on shared devices

- **Persona:** Carlos
- **Priority:** Must
- **Story points:** 1

#### Acceptance criteria
1. **Given** I'm signed in
   **When** I click "Sign out" in the topbar
   **Then** the session cookie is cleared and I'm redirected to `/login`.
2. **Given** I've signed out
   **When** I attempt to access `/dashboard` via the back button
   **Then** middleware redirects me to `/login`.

---

### US-005 · Protected routes enforce session

**As** the system
**I want** to block unauthenticated access to tenant pages
**So that** data isolation is guaranteed

- **Persona:** (System behaviour)
- **Priority:** Must
- **Story points:** 2

#### Business rules
- **Middleware** (`src/middleware.ts`) runs at the edge on every request except `/api/auth/*`, `/api/webhooks/*`, `/login`, `/register`, and public assets.
- Middleware uses `authConfig` (lightweight, no Prisma) to check JWT presence.
- Unauthenticated requests are redirected to `/login`.
- Tenant pages (`/dashboard`, `/scope/*`, `/emissions`, `/reports`, `/settings`) and admin pages (`/admin/*`) both require a valid session.

#### Acceptance criteria
1. **Given** I have no session cookie
   **When** I request `GET /dashboard`
   **Then** I get a 307 redirect to `/login`.
2. **Given** I have a valid session but am not a super admin
   **When** I request `/admin`
   **Then** in demo mode I am allowed through (production: redirect to `/dashboard`).
3. **Given** any authenticated request
   **When** the server queries tenant data
   **Then** the query filters by `entityId` from `session.user.entityId` — never trusting client-sent IDs.

---

## 4. Epic 2 — Onboarding & Workspace Navigation

**Goal:** Help users find their way around the app after signing in.

---

### US-010 · Land on the dashboard after sign-in

**As** Carlos
**I want** to see my emissions dashboard as my landing page
**So that** I get value within seconds of signing in

- **Priority:** Must · **Story points:** 1

#### Acceptance criteria
1. **Given** I sign in successfully
   **When** the redirect completes
   **Then** I see the dashboard for the current year with total emissions and scope cards.

---

### US-011 · Navigate via the persistent sidebar

**As** any user
**I want** a sidebar with links to all major areas
**So that** I can move between sections without thinking

- **Priority:** Must · **Story points:** 2

#### Business rules
- Sidebar is **permanent** on desktop (≥ 992px viewport width) and **temporary** (hamburger-triggered) on mobile.
- Active route is visually highlighted.
- Sidebar shows:
  - **Dashboard** · **All Records** (Emissions)
  - **Calculator** section: Scope 1, Scope 2, Scope 3
  - **Reporting** section: Reports, Settings
  - **Platform** section: Admin Panel (if user has permission or in demo mode)
- The Carbonly logo links back to `/`.
- The footer shows user's name and role.

#### Acceptance criteria
1. **Given** I'm on the dashboard
   **When** I click "All Records"
   **Then** I navigate to `/emissions` and the sidebar highlights that item.
2. **Given** I'm on a mobile viewport (<992px)
   **When** I tap the hamburger icon
   **Then** a temporary drawer slides in, and tapping an item closes the drawer after navigation.

---

### US-012 · Switch role (demo mode)

**As** a demo visitor
**I want** to switch between the admin view and the expert view without re-login
**So that** I can explore both perspectives quickly

- **Priority:** Could (demo-only) · **Story points:** 2

#### Business rules
- In the **admin sidebar** footer, a "Switch role" section offers a button labelled **Expert View**.
- Clicking it calls `signIn("credentials", { email: "expert@acme-corp.com", password: "expert1234", redirect: true, callbackUrl: "/dashboard" })`.
- This replaces the current session entirely (NextAuth v5 behaviour).

#### Acceptance criteria
1. **Given** I'm signed in as super admin on `/admin`
   **When** I click "Expert View"
   **Then** my session is replaced by the expert account and I'm redirected to `/dashboard`.
2. **Given** the expert's dashboard sidebar includes an "Admin Panel" link
   **When** I click it
   **Then** I'm taken to `/admin` without a redirect block.

---

## 5. Epic 3 — Emissions Dashboard

**Goal:** Give tenant users instant insight into their carbon footprint.

---

### US-020 · View total emissions hero panel

**As** Emma
**I want** to see a large "Total Emissions" hero card at the top of my dashboard
**So that** I get the headline number at a glance

- **Priority:** Must · **Story points:** 3

#### Business rules
- Hero card shows **total tCO₂e** for the selected year, with 1 decimal place.
- Below the number, a **12-month sparkline** shows monthly distribution.
- Two chips compare current year to:
  - **Prior year** (`yoyChangePct` %, green if lower, red if higher)
  - **Baseline year** (2021) (`vsBaselinePct` %, same colour logic)
- If there is no data for the selected year, the card shows "No data yet — start by logging emissions in the Scope calculators".

#### Acceptance criteria
1. **Given** 450 emission records totalling 1,248.5 tCO₂e for 2025
   **When** I view `/dashboard?year=2025`
   **Then** the hero shows "1,248.5 t CO₂e" with the correct YoY and baseline chips.
2. **Given** the prior year had 1,420 tCO₂e
   **When** I'm on 2025 (1,248.5 tCO₂e)
   **Then** the YoY chip reads "↓ 12%" and is coloured green.
3. **Given** 2025 is the selected year and it's the baseline
   **When** the card renders
   **Then** no "vs baseline" chip is shown (would always be 0%).

---

### US-021 · View scope breakdown cards

**As** Carlos
**I want** to see individual cards for Scope 1, Scope 2, and Scope 3
**So that** I can see where my emissions concentrate

- **Priority:** Must · **Story points:** 2

#### Business rules
- Three cards in a row (or stacked on mobile via Bootstrap `col-12 col-md-4`).
- Each card shows: scope label, sub-label (e.g. "Direct", "Energy", "Value Chain"), tCO₂e value, percentage of total, and a progress bar.
- Cards are **clickable** — clicking expands a drill-down panel below showing top activities for that scope.
- Colour mapping: Scope 1 green, Scope 2 teal/blue, Scope 3 amber.

#### Acceptance criteria
1. **Given** Scope 1 = 342.1 t, Scope 2 = 518.4 t, Scope 3 = 388 t (total 1248.5)
   **When** I view the cards
   **Then** Scope 2 shows "42%" and its bar fills 42% of the track.
2. **Given** I click Scope 2
   **When** the panel opens
   **Then** I see Scope 2 activities sorted by CO₂e descending.
3. **Given** I click Scope 2 again
   **When** the same card is clicked
   **Then** the panel collapses.

---

### US-022 · View scope breakdown pie chart

**As** Emma
**I want** an interactive pie chart showing the scope split
**So that** I have a visual proportion at a glance

- **Priority:** Should · **Story points:** 3

#### Business rules
- Recharts `PieChart` with 3 slices.
- Hovering a slice shows tooltip with tCO₂e value.
- Clicking a slice opens a drill-down sub-view showing the top activities in that scope.
- Drill-down includes a "← Back" button to return to the overall view.

---

### US-023 · View monthly trend chart

**As** Carlos
**I want** a 12-month bar or area chart
**So that** I can spot seasonal peaks

- **Priority:** Should · **Story points:** 2

#### Business rules
- Months Jan–Dec on X axis; tCO₂e on Y axis.
- Bars for months with no data show 0 (not missing).
- A horizontal dashed reference line shows the **average** across all months.
- Current month is highlighted with a subtle accent.

#### Acceptance criteria
1. **Given** I'm viewing 2026 and it's April
   **When** the chart renders
   **Then** Jan–Apr show data and May–Dec are 0 bars.

---

### US-024 · Switch the dashboard year

**As** Emma
**I want** to switch between 2021–2026 on the dashboard
**So that** I can review historical performance

- **Priority:** Must · **Story points:** 2

#### Validations
- Year range: **2021–2026** (dynamic, based on configured years).

#### Business rules
- Year picker is a segmented control (MUI `ToggleButtonGroup`).
- 2021 is labelled "Baseline" with a green dot.
- 2026 is labelled "Current" with an amber dot (partial-year data).
- Changing year updates `?year=XXXX` in the URL and re-renders the server component.
- `useTransition` keeps the UI responsive during the navigation.

#### Acceptance criteria
1. **Given** I'm on `/dashboard?year=2024`
   **When** I click "2025"
   **Then** URL changes to `?year=2025` and all panels re-fetch without a hard reload.

---

### US-025 · View top emitting activities

**As** Emma
**I want** a table of the top 5 emitting activities for the year
**So that** I know where to focus reduction efforts

- **Priority:** Should · **Story points:** 2

#### Business rules
- Table ranks activities by summed tCO₂e descending.
- Shows rank badge (#1–#5), activity name, scope chip, tCO₂e, and percentage share of total.
- Activity names are truncated with ellipsis if > 40 chars.

---

### US-026 · View consumption breakdown

**As** Carlos
**I want** to see total consumption per unit (kWh, litres, km, etc.)
**So that** I understand activity volumes alongside their emissions

- **Priority:** Could · **Story points:** 2

#### Business rules
- Records are grouped by `unit`.
- For each unit: show total quantity and the top 3 contributing activities.
- Each unit group has a colour-coded chip for quick scanning.

---

## 6. Epic 4 — Emissions Calculator (Scopes 1–3)

**Goal:** Let users log activity data and have the system compute CO₂e automatically.

---

### US-030 · Log a Scope 1 emission record

**As** Carlos
**I want** to log fuel consumption (natural gas, diesel, petrol, refrigerant leaks)
**So that** our direct emissions are tracked

- **Priority:** Must · **Story points:** 5 · **Dependencies:** US-002

#### Validations
| Field | Rule |
|---|---|
| Activity | Required · must belong to Scope 1 · must be `isActive = true` |
| Emission factor | Required · must belong to the selected activity |
| Quantity | Required · numeric · > 0 · max 15 decimal digits |
| Unit | Required · must match the activity's default unit (informational) |
| Period | Required · month/year picker · must be ≤ current month of current year |
| Notes | Optional · max 500 chars |

#### Business rules
- CO₂e is computed server-side using `engine.calculate({ quantity, emissionFactorValue: factor.value })`.
- Formula: `co2eKg = quantity × factor.value`; `co2eT = co2eKg / 1000`.
- Results are rounded: `co2eKg` to 3 decimals, `co2eT` to 6 decimals.
- The `EmissionRecord` row stores both `co2eKg` and `co2eT` (denormalised for dashboard reads).
- The selected `emissionFactorId` is **immutable** once saved — changing the factor in the admin panel does NOT change historical records.
- On successful save, the API returns 201 with the full record (including joined activity + factor).

#### Acceptance criteria
1. **Given** I enter 12,400 kWh of natural gas with the UK DEFRA 2024 factor (0.18316 kgCO₂e/kWh)
   **When** I submit
   **Then** a record is created with `co2eKg = 2271.18` and `co2eT = 2.27118`.
2. **Given** I enter quantity `-5`
   **When** I submit
   **Then** I see "Quantity must be greater than 0" and no record is created.
3. **Given** I pick a period in the future (e.g. 2027-06)
   **When** I submit
   **Then** the API returns 400 with "Period cannot be in the future".
4. **Given** I select a deactivated activity
   **When** the form renders
   **Then** it doesn't appear in the dropdown.

#### Edge cases
- Quantity of 0 is rejected.
- `Infinity` or `NaN` from DevTools tampering is rejected by Zod.

---

### US-031 · Log a Scope 2 emission record

**As** Carlos
**I want** to log monthly grid electricity consumption with the right regional factor
**So that** our purchased-energy emissions reflect the correct grid carbon intensity

- **Priority:** Must · **Story points:** 3

#### Business rules
- Same engine/validation as Scope 1.
- The factor picker defaults to the activity's `isDefault` factor but lets me pick alternatives (UK, US, EU).
- Scope 2 methodology is **location-based only** in Phase 1 (market-based RECs deferred).

#### Acceptance criteria
1. **Given** I log 48,000 kWh with UK DEFRA 2024 factor 0.20493 kgCO₂e/kWh
   **When** I submit
   **Then** `co2eKg = 9,836.64`.

---

### US-032 · Log a Scope 3 emission record

**As** Carlos
**I want** to log business travel, commuting, purchased goods, and waste
**So that** our full value-chain footprint is captured

- **Priority:** Must · **Story points:** 3

#### Business rules
- Same engine/validation.
- Units are activity-specific (passenger-km, tonnes, kg).
- Notes are particularly useful here (e.g. flight origin/destination).

#### Acceptance criteria
1. **Given** I log 24,600 passenger-km of long-haul flight at 0.195 kgCO₂e/pkm
   **When** I submit
   **Then** `co2eKg = 4,797` and a new record appears in the All Records list.

---

### US-033 · See factor details before saving

**As** Carlos
**I want** to see the selected factor's source, region, and value before I commit
**So that** I don't accidentally use the wrong one

- **Priority:** Should · **Story points:** 1

#### Acceptance criteria
1. **Given** I select a factor in the picker
   **When** the side panel updates
   **Then** I see "Source: DEFRA · Region: UK · Value: 0.20493 kgCO₂e/kWh · GWP: IPCC AR5 100-year".

---

### US-034 · See a live CO₂e preview

**As** Carlos
**I want** the form to show me the estimated CO₂e before I submit
**So that** I can sanity-check the order of magnitude

- **Priority:** Could · **Story points:** 2

#### Acceptance criteria
1. **Given** I've selected an activity with factor 0.20493 and typed quantity 1000
   **When** the form updates
   **Then** a "Preview" chip shows "≈ 204.93 kg CO₂e / 0.205 t CO₂e".

---

## 7. Epic 5 — Emission Records Management

**Goal:** Let tenant users review, filter, and manage what's been logged.

---

### US-040 · View all records

**As** Emma
**I want** a paginated, filterable list of every emission record
**So that** I can audit what my team has entered

- **Priority:** Must · **Story points:** 3

#### Validations
- Page size fixed at **20**; page number from `?page=` query param.

#### Business rules
- Columns: Date (period), Scope chip, Activity, Quantity + unit, CO₂e (t), Emission factor, User (who entered), Data source (MANUAL / CSV_IMPORT / API).
- Default sort: `period` descending.
- Scope chips are colour-coded consistently.
- Empty state shows an illustration and "No records yet — start with a Scope calculator".

#### Acceptance criteria
1. **Given** my entity has 450 records
   **When** I visit `/emissions`
   **Then** I see page 1 of 23 (20 per page), sorted newest first.
2. **Given** I click the Scope 2 chip on a row
   **When** the URL updates to `?scope=2`
   **Then** only Scope 2 records are shown.

---

### US-041 · Filter records by year

**As** Emma
**I want** to narrow records to a specific year
**So that** I can produce period-specific audits

- **Priority:** Should · **Story points:** 1

#### Acceptance criteria
1. **Given** `/emissions` has a year dropdown
   **When** I pick "2025"
   **Then** URL changes to `?year=2025` and the list refreshes.

---

## 8. Epic 6 — Reporting

**Goal:** Turn raw records into ISO 14064-aligned annual reports.

---

### US-050 · Generate an annual report

**As** Emma
**I want** to generate a GHG report for a specific year
**So that** I can share aggregated data with auditors, investors, or regulators

- **Priority:** Must · **Story points:** 8 · **Dependencies:** US-030, US-031, US-032

#### Validations
| Field | Rule |
|---|---|
| Year | Required · 2021 ≤ year ≤ current year · must have ≥ 1 record for that year · no existing report for that year |

#### Business rules
- Report generation is triggered by `POST /api/reports` with `{ year }`.
- The API aggregates data from 4 parallel queries:
  1. All records for (entity, year) with scope + activity joined
  2. Previous-year aggregate for YoY computation
  3. 2021 baseline aggregate for vs-baseline computation
  4. Entity metadata (for the report title)
- The aggregated JSON **summary** is stored in `Report.summary` (JSONB).
- `Report.status` is set to `GENERATED`.
- If a report for the same (entity, year) already exists, API returns **409 Conflict**.
- If no records exist for the year, API returns **422 Unprocessable Entity** with a helpful message.

#### Summary JSON shape
```json
{
  "totalCo2eT": 1248.5,
  "recordCount": 450,
  "scope1": { "co2eT": 342.1, "pct": 27.4, "activities": [] },
  "scope2": { "co2eT": 518.4, "pct": 41.5, "activities": [] },
  "scope3": { "co2eT": 388.0, "pct": 31.1, "activities": [] },
  "byMonth": [{ "month": 1, "co2eT": 92.3 }],
  "topActivities": [{ "name": "Grid electricity", "co2eT": 234.1, "scope": 2 }],
  "baselineCo2eT": 1812.4,
  "prevYearCo2eT": 1418.0,
  "yoyChangePct": -11.95,
  "vsBaselinePct": -31.12,
  "entityName": "Acme Corp",
  "generatedAt": "2026-04-15T10:23:00Z"
}
```

#### Acceptance criteria
1. **Given** I click "Generate Report" and pick year 2025
   **When** the API completes
   **Then** a new `Report` row is created with `status = GENERATED` and I see its detail panel inline.
2. **Given** a report for 2025 already exists
   **When** I try to generate another
   **Then** I see "A report for 2025 already exists — delete it first" and no new row is inserted.
3. **Given** 2027 has zero records
   **When** I try to generate a report for 2027
   **Then** I see "No emission records found for 2027".

---

### US-051 · View report detail panel

**As** Emma
**I want** to view the full breakdown of a generated report inline
**So that** I don't need to download a PDF just to review it

- **Priority:** Must · **Story points:** 5

#### Business rules
- Clicking a report row expands an inline panel showing:
  - 4 KPI cards (total emissions, YoY change, vs baseline, data quality)
  - Scope breakdown bars
  - 12-month bar chart
  - Top 5 emission sources with rank badges
- Data quality is derived from `recordCount`: High (≥50), Medium (20–49), Low (<20).

---

### US-052 · Export report as CSV

**As** Carlos
**I want** to download a report as CSV
**So that** I can analyse it in Excel or feed it into another tool

- **Priority:** Must · **Story points:** 3

#### Business rules
- `GET /api/reports/[id]/export?format=csv` returns `text/csv` with `Content-Disposition: attachment`.
- Filename pattern: `carbonly-ghg-report-{year}.csv`.
- CSV contents (in this order):
  1. Report header block (organisation, year, title, generated timestamp, status)
  2. Summary block (total, prior year, YoY %, baseline, vs-baseline %)
  3. Scope breakdown (3 rows)
  4. Activities by scope (one row per activity)
  5. Monthly trend (12 rows: Jan–Dec)
  6. Top activities (rank, name, scope, tCO₂e)
  7. Footer credit line
- Values containing commas, quotes, or newlines are properly RFC 4180 escaped.

---

### US-053 · Publish / unpublish a report

**As** Emma
**I want** to mark a report as PUBLISHED (or revert to GENERATED)
**So that** I can signal internally when a report is ready to share

- **Priority:** Should · **Story points:** 2

#### Business rules
- `PATCH /api/reports/[id]` with `{ status: "PUBLISHED" | "GENERATED" }`.
- Publish button only available for `GENERATED` reports.
- Unpublish button only available for `PUBLISHED` reports.

---

### US-054 · Delete a report

**As** Emma
**I want** to delete a mistakenly generated report
**So that** I can re-generate with corrected data

- **Priority:** Should · **Story points:** 1

#### Business rules
- `DELETE /api/reports/[id]` removes the row.
- A `confirm()` dialog warns the action is irreversible.

---

## 9. Epic 7 — Settings & Profile

**Goal:** Let users review their profile and organisation details.

---

### US-060 · View my profile

**As** Carlos
**I want** to see my name, email, role, and member-since date
**So that** I can verify the account I'm signed into

- **Priority:** Should · **Story points:** 1

---

### US-061 · View my organisation details

**As** Emma
**I want** to see my organisation's name, slug, industry, country, and subscription status
**So that** I can confirm the tenant context

- **Priority:** Should · **Story points:** 1

---

### US-062 · View billing summary

**As** Emma
**I want** a Billing section showing my current plan, status, and trial end date
**So that** I know where my subscription stands

- **Priority:** Must · **Story points:** 3

#### Business rules
- Plan is resolved from `Entity.stripePriceId` via `getPlanByPriceId()`.
- Status chip uses colour mapping (ACTIVE=green, TRIALING=blue, PAST_DUE=amber, CANCELED=red).
- If `stripeCustomerId` is set, a "Manage billing" button opens the Stripe Customer Portal.
- If status is NONE / CANCELED / TRIALING, an "Upgrade plan" link routes to `/#pricing`.

#### Acceptance criteria
1. **Given** I'm on a TRIALING subscription ending on 2026-04-30
   **When** I visit Settings
   **Then** I see "Trial ends in 15 days — 30 April 2026".

---

## 10. Epic 8 — Billing & Subscriptions

**Goal:** Monetise via Stripe with three tiers and a 14-day trial.

---

### US-070 · View pricing on the landing page

**As** Priya
**I want** to see three plan tiers with features and prices
**So that** I can evaluate Carbonly against alternatives

- **Priority:** Must · **Story points:** 3

#### Business rules
- Plans defined in `src/lib/stripe/plans.ts`:

| Plan | Monthly | Annual | Users | Scopes | History | Trial |
|---|---|---|---|---|---|---|
| Starter | £49 | £39 | 3 | 1, 2 | 1 year | 14 days |
| Professional | £149 | £119 | 15 | 1, 2, 3 | unlimited | 14 days |
| Enterprise | Custom | Custom | unlimited | 1, 2, 3 | unlimited | — |

- Professional has a "Most Popular" badge and is visually highlighted.
- Enterprise CTA says "Contact sales" and opens a `mailto:sales@carbonly.io`.

---

### US-071 · Start a paid plan via Stripe Checkout

**As** Emma
**I want** to click "Start free trial" on a plan and go through Stripe Checkout
**So that** my organisation gets onto that plan with a 14-day trial

- **Priority:** Must · **Story points:** 5

#### Validations
- User must be authenticated; if not, redirect to `/register`.
- User's `entityId` must exist.

#### Business rules
- `POST /api/stripe/checkout` with `{ planKey }` does:
  1. Ensure a `Customer` exists on Stripe; create if missing; save `stripeCustomerId`.
  2. Create a **Checkout Session** with `mode: "subscription"`, `trial_period_days: 14`, `success_url: /dashboard?upgraded=1`, `cancel_url: /pricing?canceled=1`.
  3. Return `{ url }` for client-side redirect.
- On success, Stripe fires `customer.subscription.created` → webhook → `Entity.subscriptionStatus = TRIALING`.

#### Acceptance criteria
1. **Given** I click "Start free trial" on Professional
   **When** the API responds
   **Then** I'm redirected to Stripe's hosted checkout with the correct price ID and trial config.
2. **Given** I cancel at Stripe
   **When** I return
   **Then** I land on `/pricing?canceled=1` and no subscription was created.

---

### US-072 · Keep subscription state in sync via webhooks

**As** the system
**I want** to mirror Stripe subscription state into the `Entity` table
**So that** the UI reflects reality without polling

- **Priority:** Must · **Story points:** 5

#### Validations
- Webhook signature verified with `STRIPE_WEBHOOK_SECRET` via `stripe.webhooks.constructEvent()`.
- Unverified payloads return 400 without DB writes.

#### Business rules
- Events handled:

| Event | Action |
|---|---|
| `customer.subscription.created` | Save `subscriptionStatus`, `stripeSubscriptionId`, `stripePriceId` |
| `customer.subscription.updated` | Same as created |
| `customer.subscription.deleted` | Set `subscriptionStatus = CANCELED` |
| `invoice.payment_failed` | Set `subscriptionStatus = PAST_DUE` |

- Stripe status → Carbonly enum mapping:

| Stripe | Carbonly |
|---|---|
| trialing | TRIALING |
| active | ACTIVE |
| past_due | PAST_DUE |
| canceled | CANCELED |
| unpaid | UNPAID |
| incomplete, incomplete_expired, paused | PAST_DUE (fallback: CANCELED) |

---

### US-073 · Open the Stripe Customer Portal

**As** Emma
**I want** a "Manage billing" button that takes me to Stripe's hosted portal
**So that** I can update my card, see invoices, and change plan

- **Priority:** Must · **Story points:** 2

#### Business rules
- `POST /api/stripe/portal` creates a **billing portal session** with `return_url: /settings`.
- Returns `{ url }` for client redirect.
- Only available when `stripeCustomerId` is set.

---

## 11. Epic 9 — Admin: Entity Management

**Goal:** Let platform admins manage tenant organisations.

---

### US-080 · View all entities

**As** Adam
**I want** a searchable list of every tenant organisation on the platform
**So that** I can monitor and support them

- **Priority:** Must · **Story points:** 3

#### Business rules
- Table columns: Name, Slug (monospace), Industry, Country, Status chip, Users count, Records count, Created date.
- Stat cards above the table: Total, Active, Trialing, Churned (CANCELED + UNPAID).
- Search filters name or slug (client-side since dataset is small).

---

### US-081 · Create a new entity

**As** Adam
**I want** to create a new organisation via a sidesheet form
**So that** a new customer is onboarded

- **Priority:** Must · **Story points:** 3

#### Validations
| Field | Rule |
|---|---|
| Name | Required · 2–80 chars |
| Slug | Optional · if empty, auto-generated from name (lowercase, hyphen-separated, alphanumerics only) · must be unique |
| Industry | Optional · free text |
| Country | Optional · free text |
| Subscription status | Defaults to `TRIALING` · must be one of the enum values |

#### Acceptance criteria
1. **Given** I open the "New Organisation" sidesheet and type "GreenTech Solutions"
   **When** I submit without a slug
   **Then** a row is created with slug `"greentech-solutions"`.
2. **Given** I submit with slug "acme-corp" which already exists
   **When** the form submits
   **Then** I see the error "Slug already in use".

---

### US-082 · Edit an entity

**As** Adam
**I want** to edit an entity's name, industry, country, or status
**So that** I can keep records current

- **Priority:** Must · **Story points:** 2

---

### US-083 · Delete an entity

**As** Adam
**I want** to delete an entity and all its data
**So that** I can offboard customers cleanly

- **Priority:** Should · **Story points:** 2

#### Business rules
- `DELETE /api/admin/entities/[id]` triggers Prisma cascade deletes: `UserEntity`, `EmissionRecord`, `Report`, `YearlyConfig`.
- A `confirm()` dialog warns: "This will remove all users, records and reports".

#### Acceptance criteria
1. **Given** an entity with 5 users, 450 records, 2 reports
   **When** I confirm deletion
   **Then** all associated rows are removed and the stat cards update.

---

## 12. Epic 10 — Admin: User Management

---

### US-090 · View all users

**As** Adam
**I want** a list of every registered user with their entity memberships
**So that** I can audit access

- **Priority:** Must · **Story points:** 2

#### Business rules
- Columns: Name, Email, Role chip, Organisation, Joined.
- "You" badge on the current user row.
- Stat cards: Total, Super Admins, Admins, Experts.

---

### US-091 · Invite (create) a user

**As** Adam
**I want** to create a new user and assign them to an entity
**So that** they can sign in immediately

- **Priority:** Must · **Story points:** 3

#### Validations
| Field | Rule |
|---|---|
| Name | Optional · ≤ 80 chars |
| Email | Required · valid format · unique |
| Temporary password | Optional · if set, ≥ 8 chars |
| Global role | Required · EXPERT (default), ADMIN, or SUPER_ADMIN |
| Entity | Optional · if set, creates `UserEntity` row |
| Entity role | Required if entity is set · EXPERT (default) or ADMIN |

#### Acceptance criteria
1. **Given** I invite `jane@acme-corp.com` as EXPERT at Acme Corp
   **When** I submit
   **Then** a user + entity membership row is created and she appears in the table.

---

### US-092 · Edit a user

**As** Adam
**I want** to edit a user's name or global role
**So that** I can correct onboarding mistakes or promote users

- **Priority:** Must · **Story points:** 2

---

### US-093 · Delete a user

**As** Adam
**I want** to delete a user
**So that** I can revoke access

- **Priority:** Must · **Story points:** 1

#### Business rules
- A user **cannot delete their own account** — API returns 400 "You cannot delete your own account".
- Cascade deletes: `UserEntity`, `Session`, `Account`.

---

## 13. Epic 11 — Admin: Taxonomy Management

---

### US-100 · View scopes & activities

**As** Adam
**I want** to see each scope with its activities
**So that** I can maintain the GHG Protocol taxonomy

- **Priority:** Must · **Story points:** 2

#### Business rules
- Three scope sections (Scope 1, 2, 3) with coloured headers and gradient icons.
- Each row: Activity name, description (truncated), Unit, Equation, Emission factor count, Active toggle.

---

### US-101 · Add a new activity

**As** Adam
**I want** to add a new activity under a scope
**So that** I can keep up with evolving reporting requirements

- **Priority:** Must · **Story points:** 2

#### Validations
| Field | Rule |
|---|---|
| Scope | Required · from existing scopes |
| Name | Required · ≤ 120 chars |
| Description | Optional · ≤ 500 chars |
| Unit | Required · ≤ 30 chars (e.g. "kWh", "litres", "passenger-km") |
| Equation | Optional · defaults to "quantity × emissionFactor" |

#### Business rules
- Auto-increments `sortOrder` = max(sortOrder)+1 within the scope.
- Defaults to `isActive = true`.

---

### US-102 · Edit / deactivate an activity

**As** Adam
**I want** to update an activity or toggle its active state
**So that** I can retire deprecated activities without breaking history

- **Priority:** Must · **Story points:** 2

#### Business rules
- Deactivated activities don't appear in the calculator dropdown but existing records are preserved.

---

### US-103 · Delete an activity

**As** Adam
**I want** to delete an activity that has no emission factors
**So that** I can clean up truly unused entries

- **Priority:** Should · **Story points:** 1

#### Business rules
- `DELETE /api/admin/activities/[id]` returns **409 Conflict** if any `EmissionFactor` rows reference the activity.

---

## 14. Epic 12 — Admin: Emission Factor Management

---

### US-110 · View all emission factors

**As** Adam
**I want** a master table of every factor with its activity, value, unit, source, region, and default flag
**So that** I can audit the taxonomy

- **Priority:** Must · **Story points:** 3

#### Business rules
- Columns: Scope chip, Activity, Factor name, Value (mono), Unit, Source, Region, Default chip.
- Search filters by factor name, activity name, or source.
- Scope filter dropdown (All / 1 / 2 / 3).
- Stats: Total factors, Defaults, per-scope counts.

---

### US-111 · Add a new factor

**As** Adam
**I want** to add a new factor to an existing activity
**So that** users have the latest regulator-issued values

- **Priority:** Must · **Story points:** 3

#### Validations
| Field | Rule |
|---|---|
| Activity | Required · must be active |
| Factor name | Required · ≤ 120 chars (e.g. "UK DEFRA 2024") |
| Value | Required · positive number · ≤ 15 decimal digits |
| Unit | Required · e.g. "kgCO2e/kWh" |
| Source | Optional |
| Region | Optional (e.g. "UK", "US", "EU") |
| GWP | Optional (e.g. "IPCC AR5 100-year") |
| Is default | Boolean |

#### Business rules
- If `isDefault = true`, the API **automatically un-defaults all other factors for the same activity** (single-default rule).

#### Acceptance criteria
1. **Given** Activity "Grid electricity" has a default factor "DEFRA 2023"
   **When** I add a new factor "DEFRA 2024" marked as default
   **Then** DEFRA 2023 is automatically un-defaulted in the same transaction.

---

### US-112 · Edit / toggle-default a factor

**As** Adam
**I want** to update a factor's value or toggle its default flag
**So that** I can roll over to a new year's factor without recreating records

- **Priority:** Must · **Story points:** 2

---

### US-113 · Delete a factor

**As** Adam
**I want** to delete a factor that isn't referenced by any records
**So that** I can clean up unused entries

- **Priority:** Should · **Story points:** 1

#### Business rules
- Returns **409 Conflict** if `EmissionRecord` rows reference the factor.

---

## 15. Epic 13 — Admin: Platform Analytics & Billing Insights

---

### US-120 · View platform overview

**As** Adam
**I want** a dashboard of platform-wide KPIs
**So that** I can monitor health at a glance

- **Priority:** Must · **Story points:** 5

#### Business rules
- Hero banner (dark gradient) with welcome text.
- KPI cards: Organisations, Users, Emission Records, CO₂e Tracked (tonnes).
- Subscription status breakdown (5-tile panel).
- Taxonomy summary panel (scopes, activities, factors, reports).
- Recent orgs list · Recent users list · Recent emission activity feed.

---

### US-121 · View billing analytics

**As** Adam
**I want** revenue-focused analytics (MRR, active customers, conversion, trials ending)
**So that** I can track SaaS metrics

- **Priority:** Must · **Story points:** 5

#### Business rules
- MRR = sum of `monthlyPrice` across entities with `subscriptionStatus = ACTIVE` (priced via `getPlanByPriceId`).
- Conversion = % of all entities currently `ACTIVE`.
- Trials ending = entities with `subscriptionStatus = TRIALING` and `trialEndsAt ≤ now + 7 days`.
- Plan distribution bars (Starter / Professional / Enterprise / None).
- Subscription status cards (5 states).
- Alert banner showing trials ending soon with day countdown.
- Full subscription table with plan, status, trial end, stripe customer ID (truncated), users count.

#### Acceptance criteria
1. **Given** 3 active professional customers at £149/mo
   **When** I view `/admin/billing`
   **Then** MRR reads "£447".

---

## 16. Epic 14 — Marketing & Landing Page

---

### US-130 · View the landing page

**As** Priya
**I want** a polished landing page that explains Carbonly in 30 seconds
**So that** I decide whether to sign up

- **Priority:** Must · **Story points:** 5

#### Business rules
- Sections: Hero (dark green gradient, typewriter headline) · Trusted-by industry chips · Animated stats bar with count-up · Features grid (6 items) · "How it works" with interactive 3-step auto-advance panel · Pricing · Testimonials · CTA banner · Footer.
- Landing nav is sticky; transitions to frosted glass on scroll.
- Responsive: single-column mobile, 2-col tablet, full layout desktop.
- All links to `/register` and `/login` work.

---

### US-131 · Start free trial from pricing

**As** Priya
**I want** "Start free trial" buttons on each plan card
**So that** I can sign up directly from pricing

- **Priority:** Must · **Story points:** 2

#### Business rules
- Clicking calls `POST /api/stripe/checkout`; if unauthenticated (401), redirect to `/register`.
- Enterprise CTA opens `mailto:sales@carbonly.io?subject=Enterprise enquiry`.

---

## 17. Cross-cutting acceptance criteria

These apply to **every** story:

### 17.1 Security

- ✅ No tenant data is ever returned or mutated without filtering by `entityId` from the current session.
- ✅ All destructive admin actions require `confirm()` on the client.
- ✅ Stripe webhooks are signature-verified before mutating state.
- ✅ No secret (Stripe key, NextAuth secret, DB password) is exposed to the client bundle.
- ✅ Server-sent HTML escapes all user-supplied strings (React defaults).

### 17.2 Error handling

- ✅ All API routes return JSON `{ error: string }` with an appropriate 4xx/5xx status.
- ✅ Client-side UI displays errors using MUI `Alert` components or inline helper text.
- ✅ Network failures show a user-friendly "Network error — please try again" message.
- ✅ 500s are logged server-side (Prisma error logs at `error` level in production).

### 17.3 Accessibility

- ✅ All interactive elements are keyboard accessible (Tab order, Enter/Space to activate).
- ✅ Form inputs have associated `<label>` elements.
- ✅ Colour is never the sole indicator of state (badges include text + icon).
- ✅ Focus rings are visible on all focusable elements.

### 17.4 Performance

- ✅ Initial page load ≤ 1.5s on a fast 3G connection.
- ✅ Dashboard data query ≤ 50ms on ~2,000 records.
- ✅ All pages use server components to avoid client waterfalls.

### 17.5 Responsive design

- ✅ All pages render correctly on 375px (mobile), 768px (tablet), 1280px (desktop).
- ✅ Admin tables support horizontal scroll on narrow viewports.
- ✅ Sidebar is a permanent drawer on ≥992px, temporary (hamburger) below.

### 17.6 Data integrity

- ✅ All foreign keys use cascading delete where ownership is clear (Entity → UserEntity/EmissionRecord/Report/YearlyConfig).
- ✅ Emission factor references in `EmissionRecord` are immutable post-creation.
- ✅ All CO₂e calculations are performed server-side; client inputs are never trusted.

---

## 18. Traceability matrix

Each functional requirement in the BRD is covered by one or more user stories:

| BRD Ref | Requirement | Covered by |
|---|---|---|
| FR-AUTH-01 | Email/password + Google auth | US-001, US-002, US-003 |
| FR-AUTH-02 | Session expiry | US-005 |
| FR-AUTH-03 | SUPER_ADMIN platform access | US-080 through US-121 |
| FR-AUTH-04 | Entity ADMIN manages their entity | US-061, US-062, US-073 |
| FR-AUTH-05 | EXPERT scoped to assigned entity | US-030, US-031, US-032 |
| FR-AUTH-06 | Onboarding redirect | US-010 |
| FR-CALC-01 | Scope 1/2/3 calculators | US-030, US-031, US-032 |
| FR-CALC-02 | Activity + factor selection | US-033 |
| FR-CALC-03 | `CO2e = quantity × factor` | US-030 (business rules) |
| FR-CALC-04 | Store kg + tonnes | US-030 (business rules) |
| FR-CALC-05 | Capture period + notes | US-030 validations |
| FR-CALC-06 | Factor source/region/GWP | US-033, US-110 |
| FR-DASH-01 | Total by scope | US-020, US-021 |
| FR-DASH-02 | Donut chart | US-022 |
| FR-DASH-03 | Monthly trend | US-023 |
| FR-DASH-04 | Top 5 activities | US-025 |
| FR-DASH-05 | Year selection | US-024 |
| FR-ENT-01 | Entity CRUD | US-080, US-081, US-082, US-083 |
| FR-ENT-02 | Unique slug | US-081 validations |
| FR-ENT-03 | Edit entity profile | US-082 |
| FR-ENT-04 | Stripe subscription mirror | US-072 |
| FR-USR-01 | View all users | US-090 |
| FR-USR-02 | Invite by email | US-091 |
| FR-USR-03 | Change role | US-092 |
| FR-USR-04 | Deactivation | US-093 |
| FR-SCOPE-01 | Activity CRUD | US-100, US-101, US-102, US-103 |
| FR-SCOPE-02 | Activity metadata | US-101 validations |
| FR-SCOPE-03 | Factor CRUD | US-110, US-111, US-112, US-113 |
| FR-SCOPE-04 | Entity-specific overrides | Deferred (Phase 2) |
| FR-PAY-01 | Three plans | US-070 |
| FR-PAY-02 | Stripe Checkout | US-071 |
| FR-PAY-03 | Webhook status sync | US-072 |
| FR-PAY-04 | Lapsed redirect to billing | US-062 |
| FR-PAY-05 | Stripe portal | US-073 |
| FR-RPT-01 | Generate annual report | US-050 |
| FR-RPT-02 | Scope + activity breakdown | US-051 |
| FR-RPT-03 | PDF + CSV export | US-052 (CSV); PDF deferred |
| FR-RPT-04 | Status lifecycle | US-053 |
| NFR-01 | Tenant isolation | §17.1 |
| NFR-02 | RSC-first rendering | §17.4 |
| NFR-05 | Audit fields | US-030 |
| NFR-06 | Factor traceability | US-110, US-111 |
