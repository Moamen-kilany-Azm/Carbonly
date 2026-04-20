# Business Requirements Document (BRD)
## Carbonly — Carbon Emissions Management SaaS

**Version:** 2.0
**Date:** April 2026
**Status:** Approved — Active Development
**Author:** Carbonly Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Objectives](#2-business-objectives)
3. [Scope](#3-scope)
4. [Stakeholders](#4-stakeholders)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Subscription Plans](#7-subscription-plans)
8. [Assumptions & Constraints](#8-assumptions--constraints)
9. [User Stories & Acceptance Criteria](#9-user-stories--acceptance-criteria)
   - [Personas](#91-personas)
   - [Epic 1 — Authentication & Account Management](#92-epic-1--authentication--account-management)
   - [Epic 2 — Onboarding & Workspace Navigation](#93-epic-2--onboarding--workspace-navigation)
   - [Epic 3 — Emissions Dashboard](#94-epic-3--emissions-dashboard)
   - [Epic 4 — Emissions Calculator (Scopes 1–3)](#95-epic-4--emissions-calculator-scopes-13)
   - [Epic 5 — Emission Records Management](#96-epic-5--emission-records-management)
   - [Epic 6 — Reporting](#97-epic-6--reporting)
   - [Epic 7 — Settings & Profile](#98-epic-7--settings--profile)
   - [Epic 8 — Billing & Subscriptions](#99-epic-8--billing--subscriptions)
   - [Epic 9 — Admin: Entity Management](#910-epic-9--admin-entity-management)
   - [Epic 10 — Admin: User Management](#911-epic-10--admin-user-management)
   - [Epic 11 — Admin: Taxonomy Management](#912-epic-11--admin-taxonomy-management)
   - [Epic 12 — Admin: Emission Factor Management](#913-epic-12--admin-emission-factor-management)
   - [Epic 13 — Admin: Platform Analytics & Billing Insights](#914-epic-13--admin-platform-analytics--billing-insights)
   - [Epic 14 — Marketing & Landing Page](#915-epic-14--marketing--landing-page)
10. [Cross-cutting Acceptance Criteria](#10-cross-cutting-acceptance-criteria)
11. [Requirements Traceability Matrix](#11-requirements-traceability-matrix)
12. [Glossary](#12-glossary)

---

## 1. Executive Summary

Carbonly is a multi-tenant SaaS platform that enables organisations to measure, track, and report greenhouse gas (GHG) emissions across **Scope 1, Scope 2, and Scope 3** as defined by the GHG Protocol Corporate Accounting and Reporting Standard. The platform provides a structured emissions calculator, an operational dashboard, automated PDF/CSV reporting, and a full platform administration layer with subscription-based access control.

Built on Next.js 16 (App Router), TypeScript, Material UI, PostgreSQL via Prisma, and Stripe for payments, Carbonly is architected as a multi-tenant shared-schema platform serving unlimited organisations ("entities") from a single deployment. Tenant data isolation is enforced at the database query layer using `entityId` discrimination, not separate schemas.

This document captures both the high-level business requirements and the detailed user stories (with validations, business rules, acceptance criteria, and edge cases) that govern every feature of the platform. It is the single authoritative reference for engineering, QA, and product stakeholders.

---

## 2. Business Objectives

| # | Objective | Success metric |
|---|-----------|---------------|
| BO-1 | Enable organisations to comply with GHG reporting requirements (TCFD, CDP, EU CSRD) | ≥ 1 published annual report per active entity/year |
| BO-2 | Reduce the time to compile annual emissions inventories from weeks to hours | Report generation completes in < 5 seconds; total inventory entry < 4 hours |
| BO-3 | Generate recurring SaaS revenue through tiered subscription plans (Starter, Professional, Enterprise) | MRR growth ≥ 10% MoM in first 12 months |
| BO-4 | Support multiple organisations on a single platform with strict data isolation | Zero cross-tenant data leakage incidents |
| BO-5 | Provide configurable emission factors aligned to DEFRA, EPA, GHG Protocol, and IPCC sources | Factor library covers ≥ 95% of standard GHG Protocol activity categories |

---

## 3. Scope

### 3.1 In Scope

- **Scope 1 emissions calculator** — stationary combustion (natural gas, diesel, heating oil), mobile combustion (petrol, diesel vehicles), fugitive emissions (refrigerants)
- **Scope 2 emissions calculator** — purchased electricity, heat/steam (location-based method)
- **Scope 3 emissions calculator** — business travel, employee commuting, purchased goods, waste
- **Emissions dashboard** — scope breakdown, monthly trends, year-over-year comparison, baseline comparison
- **Emission records management** — full CRUD, manual entry, paginated list with filtering
- **Admin panel** — entity management, user management, scope/activity configuration, emission factor management, yearly configuration
- **Subscription and payment management** via Stripe (Checkout, Customer Portal, Webhooks)
- **Role-based access control**: SUPER_ADMIN, ADMIN (entity-level), EXPERT (entity-level)
- **PDF/CSV report generation** per year per scope
- **Multi-entity (multi-tenant) architecture** with complete data isolation
- **Marketing landing page** with animated sections, pricing, and onboarding CTAs

### 3.2 Out of Scope — Phase 1

- Automated data ingestion via IoT sensors or utility APIs
- Third-party ESG platform integrations (Salesforce, SAP, Microsoft Sustainability Manager)
- Market-based Scope 2 accounting (RECs, PPAs, guarantees of origin)
- Carbon offsetting marketplace
- Native mobile application (iOS / Android)
- Entity-specific emission factor overrides via yearly config UI (data model supports it; UI deferred)
- Bulk CSV import of emission records

---

## 4. Stakeholders

| Stakeholder | Platform role | System role |
|-------------|---------------|-------------|
| Platform Owner | Carbonly product team | Defines features, roadmap, pricing |
| **SUPER_ADMIN** (Adam) | Platform administrator | Configures taxonomy, monitors tenants, views billing analytics |
| **Entity ADMIN** (Emma) | Customer organisation admin | Manages users, yearly config, billing, publishes reports |
| **Carbon Expert / EXPERT** (Carlos) | End user at customer org | Enters activity data, runs calculations, views dashboard |
| **Visitor / Prospect** (Priya) | Unauthenticated visitor | Discovers platform, evaluates pricing, registers |
| Finance Team | Customer organisation | Approves subscription, manages payment methods |

---

## 5. Functional Requirements

### 5.1 Authentication & Authorisation

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AUTH-01 | Users must authenticate via email/password or Google OAuth | Must |
| FR-AUTH-02 | Sessions must expire after inactivity (configurable, default 30 days JWT) | Must |
| FR-AUTH-03 | SUPER_ADMIN has access to the entire platform admin panel (`/admin/**`) | Must |
| FR-AUTH-04 | Entity ADMIN can manage users and configuration within their entity | Must |
| FR-AUTH-05 | EXPERT can only access and create emission records within their assigned entity | Must |
| FR-AUTH-06 | Users not assigned to an entity must be redirected to an onboarding flow | Must |
| FR-AUTH-07 | All protected routes must be guarded by middleware at the edge (no client-only guards) | Must |
| FR-AUTH-08 | Password storage must use bcryptjs (cost factor 10); plain text never persisted | Must |

### 5.2 Emissions Calculator

| ID | Requirement | Priority |
|----|------------|----------|
| FR-CALC-01 | The system must provide calculators for Scope 1, 2, and 3 | Must |
| FR-CALC-02 | Each calculator must allow selection of activity and emission factor from the taxonomy | Must |
| FR-CALC-03 | Calculation formula: `CO2e (kg) = quantity × emission factor value` | Must |
| FR-CALC-04 | Results must be stored in both kg CO₂e and tCO₂e | Must |
| FR-CALC-05 | Each record must capture: activity, emission factor, quantity, unit, period (month/year), notes | Must |
| FR-CALC-06 | Emission factors must display source, region, GWP version, and value to users | Should |
| FR-CALC-07 | The selected emission factor ID is immutable once a record is saved | Must |
| FR-CALC-08 | Period cannot be set in the future | Must |
| FR-CALC-09 | Calculations are performed server-side; client input is never trusted | Must |

### 5.3 Dashboard

| ID | Requirement | Priority |
|----|------------|----------|
| FR-DASH-01 | Display total tCO₂e by scope for the selected year in a hero card | Must |
| FR-DASH-02 | Show scope breakdown as an interactive pie/donut chart | Should |
| FR-DASH-03 | Show monthly emission trend as a bar chart (12-month view) | Should |
| FR-DASH-04 | List top 5 emission-contributing activities | Should |
| FR-DASH-05 | Allow year selection (current year default; 2021–2026) | Must |
| FR-DASH-06 | Show year-over-year (YoY) and vs-baseline percentage comparisons | Should |
| FR-DASH-07 | Scope cards must be clickable to reveal a drill-down of activities | Should |
| FR-DASH-08 | Display total consumption breakdown grouped by unit | Could |
| FR-DASH-09 | All dashboard data is rendered server-side (RSC) on initial load | Must |

### 5.4 Admin — Entity Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-ENT-01 | SUPER_ADMIN can create, view, update, and deactivate entities | Must |
| FR-ENT-02 | Each entity has a unique slug used for tenant routing | Must |
| FR-ENT-03 | Entity ADMIN can update entity profile (name, industry, country, logo) | Should |
| FR-ENT-04 | Subscription status must reflect Stripe state in real time via webhooks | Must |
| FR-ENT-05 | Entity deletion must cascade to all child records (users, records, reports) | Should |

### 5.5 Admin — User Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-USR-01 | SUPER_ADMIN can view all users across all entities | Must |
| FR-USR-02 | SUPER_ADMIN can create users and assign them to an entity | Must |
| FR-USR-03 | SUPER_ADMIN can change a user's global role and entity role | Must |
| FR-USR-04 | A user cannot delete their own account | Must |

### 5.6 Admin — Scope & Activity Configuration

| ID | Requirement | Priority |
|----|------------|----------|
| FR-SCOPE-01 | SUPER_ADMIN can create, update, and deactivate activities under each scope | Must |
| FR-SCOPE-02 | Each activity must have a name, unit, and equation description | Must |
| FR-SCOPE-03 | Deleting an activity that has emission factors must be blocked (409) | Must |
| FR-SCOPE-04 | Deactivated activities must not appear in calculator dropdowns but must not break history | Must |

### 5.7 Admin — Emission Factor Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-EF-01 | SUPER_ADMIN can add emission factors to activities with name, value, unit, source, region, GWP | Must |
| FR-EF-02 | Only one factor per activity may be marked `isDefault = true` at a time | Must |
| FR-EF-03 | Setting a new factor as default auto-unsets the previous default for the same activity | Must |
| FR-EF-04 | Deleting a factor referenced by any emission record must be blocked (409) | Must |

### 5.8 Yearly Configuration

| ID | Requirement | Priority |
|----|------------|----------|
| FR-YEAR-01 | Each entity can have a yearly configuration per calendar year | Could |
| FR-YEAR-02 | One year can be designated as the baseline year | Could |
| FR-YEAR-03 | Yearly config anchors entity-specific emission factor overrides (Phase 2) | Won't (Phase 1) |

### 5.9 Payment Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-PAY-01 | Users can subscribe to Starter, Professional, or Enterprise plans | Must |
| FR-PAY-02 | Subscription is initiated via Stripe Checkout with a 14-day free trial | Must |
| FR-PAY-03 | Webhook at `/api/webhooks/stripe` must update entity subscription status on all payment events | Must |
| FR-PAY-04 | Entities with PAST_DUE or CANCELED status must surface a banner with a billing upgrade link | Must |
| FR-PAY-05 | Entity ADMIN can view billing history and manage payment methods via Stripe Customer Portal | Must |
| FR-PAY-06 | Stripe webhook signature must be verified before any DB mutation | Must |

### 5.10 Reporting

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RPT-01 | Users can generate a yearly emissions report per entity | Must |
| FR-RPT-02 | Reports must include: total emissions, scope breakdown, monthly trend, top activities, YoY, vs-baseline | Must |
| FR-RPT-03 | Reports can be exported as CSV (PDF export: Phase 2) | Must |
| FR-RPT-04 | Generated reports are stored with a status lifecycle: DRAFT → GENERATED → PUBLISHED | Must |
| FR-RPT-05 | If a report for the same entity/year already exists, a 409 must be returned | Must |
| FR-RPT-06 | Attempting to generate a report for a year with zero records returns 422 | Must |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|------------|
| NFR-01 | Security | All routes protected by session-based auth; tenant `entityId` isolation enforced at query level |
| NFR-02 | Performance | Dashboard renders initial data server-side (RSC); no client waterfalls on first load |
| NFR-03 | Performance | Dashboard data query < 50ms on ~2,000 records; initial page load < 1.5s on fast 3G |
| NFR-04 | Availability | Platform target 99.9% uptime SLA for Enterprise plan |
| NFR-05 | Scalability | Multi-tenant shared schema; must support 500+ entities without schema changes |
| NFR-06 | Auditability | All emission records capture `userId`, `dataSource`, and `createdAt` |
| NFR-07 | Compliance | Emission factor methodology aligned to GHG Protocol; source and vintage (year) traceable |
| NFR-08 | Accessibility | All interactive elements keyboard-accessible; colour not sole indicator of state |
| NFR-09 | Responsiveness | All pages render correctly at 375px (mobile), 768px (tablet), 1280px (desktop) |
| NFR-10 | Data integrity | Emission factor references in records are immutable post-creation |
| NFR-11 | Error handling | All API routes return `{ error: string }` JSON with appropriate 4xx/5xx status codes |

---

## 7. Subscription Plans

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Monthly price | £49/mo | £149/mo | Custom |
| Annual price | £39/mo (billed annually) | £119/mo (billed annually) | Custom |
| Users | Up to 3 | Up to 15 | Unlimited |
| Scopes | 1 & 2 | All (1, 2, 3) | All |
| Emission history | 1 year | Unlimited | Unlimited |
| Reports | Basic CSV | PDF + CSV | Custom |
| Support | Email | Priority email | Dedicated CSM |
| SLA | — | — | 99.9% |
| Free trial | 14 days | 14 days | — |

> **Billing note:** Plans are managed via Stripe price IDs configured in environment variables. The "Most Popular" badge is applied to the Professional plan.

---

## 8. Assumptions & Constraints

- Phase 1 uses **location-based** Scope 2 methodology only (market-based RECs, PPAs deferred)
- Emission factors are maintained manually by the platform SUPER_ADMIN (auto-sync from DEFRA/EPA APIs deferred)
- All monetary values are in **GBP** (configurable for future markets)
- The platform is deployed on **Vercel** with serverless PostgreSQL (Neon / Supabase compatible)
- `NEXTAUTH_SECRET` must be set; Google OAuth credentials are optional (credentials-only auth still works)
- Stripe is in **test mode** for development; production mode requires live API keys
- The baseline year is **2021** by convention (configurable per entity in Phase 2)
- Maximum quantity precision is **15 significant digits** (JavaScript number safety)
- bcryptjs hashes only the **first 72 bytes** of a password (known limitation; documented)

---

## 9. User Stories & Acceptance Criteria

This section captures every user-facing behaviour on the Carbonly platform. Each story follows the **As a / I want / So that** format, sized to fit in a single sprint, and includes explicit validation rules, business rules, Given/When/Then acceptance criteria, and edge cases.

### Story conventions

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier (e.g. `US-001`) |
| **Priority** | Must / Should / Could / Won't (MoSCoW) |
| **Story points** | Fibonacci estimate (1, 2, 3, 5, 8, 13) |
| **Validations** | Input rules enforced by UI, API, and/or database |
| **Business rules** | Non-validation domain rules |
| **Acceptance criteria** | Given / When / Then scenarios that must pass |
| **Edge cases** | Unusual paths that must be handled correctly |

---

### 9.1 Personas

#### Adam — Platform Super Admin
- **Role:** `SUPER_ADMIN`
- **Context:** Works at Carbonly, owns the platform taxonomy and tenant lifecycle
- **Goals:** Onboard customers, maintain emission factors, monitor platform revenue
- **Routes used:** `/admin/**`

#### Emma — Entity Administrator
- **Role:** `ADMIN` within an Entity
- **Context:** Head of Sustainability at Acme Corp
- **Goals:** Manage team, configure yearly baseline, approve billing, publish annual reports
- **Routes used:** `/dashboard`, `/reports`, `/settings`

#### Carlos — Carbon Expert
- **Role:** `EXPERT`
- **Context:** Environmental consultant embedded at Acme Corp
- **Goals:** Enter monthly activity data, run calculations, verify numbers before reporting
- **Routes used:** `/scope/1`, `/scope/2`, `/scope/3`, `/emissions`, `/dashboard`

#### Priya — Visitor / Prospect
- **Role:** Unauthenticated
- **Context:** Discovers Carbonly via ad or referral
- **Goals:** Understand the product and decide whether to sign up
- **Routes used:** `/` (landing page), `/register`

---

### 9.2 Epic 1 — Authentication & Account Management

**Goal:** Allow users to securely access the platform and manage their credentials.

---

#### US-001 · Register a new account

**As a** visitor **I want** to create a Carbonly account **So that** I can sign in and use the platform

- **Persona:** Priya · **Priority:** Must · **Story points:** 3

**Validations**

| Field | Rule |
|---|---|
| Full name | Required · 2–80 chars · letters, spaces, hyphens, apostrophes |
| Email | Required · valid RFC 5322 format · unique across `User.email` |
| Password | Required · min 8 chars · must contain at least one letter and one digit |
| Confirm password | Must equal `password` field |

**Business rules**
- Password stored as bcryptjs hash (cost factor 10). Plain text never persisted.
- Email comparison is case-insensitive (lowercased on both write and read).
- On successful registration, no session is created — user is redirected to `/login`.
- Duplicate-email attempts return `409 Conflict` with `"Email already registered"`.

**Acceptance criteria**
1. **Given** I am on `/register` **When** I submit valid name, email, and password **Then** a `User` row is created and I'm redirected to `/login?registered=1`.
2. **Given** `existing@example.com` already exists **When** I submit that email **Then** I see "Email already registered" and no new user is created.
3. **Given** password is `abc` **When** I submit **Then** I see "Password must be at least 8 characters".
4. **Given** JavaScript is disabled **When** I submit **Then** server-side validation still runs and errors surface.

**Edge cases**
- Whitespace-only name is rejected.
- Trailing whitespace on email is trimmed before saving.
- Unicode names (e.g. `Ayşe Yılmaz`) are accepted.

---

#### US-002 · Sign in with email and password

**As a** registered user **I want** to sign in with email and password **So that** I can access my organisation's data

- **Persona:** Carlos · **Priority:** Must · **Story points:** 3 · **Dependencies:** US-001

**Validations**

| Field | Rule |
|---|---|
| Email | Required · valid format |
| Password | Required · 1+ chars |

**Business rules**
- Authentication handled by NextAuth v5 CredentialsProvider.
- Password comparison uses `bcrypt.compare()`.
- Failed attempts return generic error `"Invalid email or password"` (no account enumeration).
- Successful sign-in issues a JWT session cookie (HttpOnly, SameSite=Lax, signed with `NEXTAUTH_SECRET`).
- JWT payload: `{ sub, globalRole, entityId, entitySlug, entityRole }`.

**Acceptance criteria**
1. **Given** valid credentials **When** I submit **Then** session cookie is set and I'm redirected to `/dashboard`.
2. **Given** wrong password **When** I submit **Then** I see "Invalid email or password" and no cookie is set.
3. **Given** non-existent email **When** I submit **Then** same generic error (no enumeration).
4. **Given** I'm already signed in **When** I visit `/login` **Then** I'm redirected to `/dashboard`.

---

#### US-003 · Sign in with Google

**As a** registered user **I want** to sign in with Google **So that** I don't need another password

- **Persona:** Emma · **Priority:** Should · **Story points:** 2

**Business rules**
- Google OAuth via NextAuth `GoogleProvider` (Authorization Code flow).
- On first sign-in, `User` + `Account` rows created by PrismaAdapter.
- Same email as a credentials account → new `Account` row links Google to existing user.

**Acceptance criteria**
1. **Given** I complete Google consent **Then** `User` created/matched and redirected to `/dashboard`.
2. **Given** existing credentials account with same email **When** Google sign-in **Then** accounts are linked — no duplicate `User`.

---

#### US-004 · Sign out

**As a** signed-in user **I want** to sign out **So that** my session ends on shared devices

- **Priority:** Must · **Story points:** 1

**Acceptance criteria**
1. **Given** I'm signed in **When** I click "Sign out" **Then** session cookie cleared, redirected to `/login`.
2. **Given** I've signed out **When** I use the browser back button to `/dashboard` **Then** middleware redirects to `/login`.

---

#### US-005 · Protected routes enforce session

**As** the system **I want** to block unauthenticated access **So that** data isolation is guaranteed

- **Priority:** Must · **Story points:** 2

**Business rules**
- Middleware (`src/middleware.ts`) runs at the edge on every request except `/api/auth/**`, `/api/webhooks/**`, `/login`, `/register`, and public assets.
- Unauthenticated requests redirect to `/login`.

**Acceptance criteria**
1. **Given** no session cookie **When** I request `GET /dashboard` **Then** 307 redirect to `/login`.
2. **Given** valid session but `globalRole !== SUPER_ADMIN` **When** I request `/admin` **Then** redirect to `/dashboard`.
3. **Given** any authenticated request **When** server queries tenant data **Then** query filters by `entityId` from `session.user.entityId`.

---

### 9.3 Epic 2 — Onboarding & Workspace Navigation

**Goal:** Help users find their way around the app after signing in.

---

#### US-010 · Land on the dashboard after sign-in

**As** Carlos **I want** to see my dashboard as my landing page **So that** I get value within seconds

- **Priority:** Must · **Story points:** 1

**Acceptance criteria**
1. **Given** I sign in successfully **Then** I see the dashboard for the current year with total emissions and scope cards.

---

#### US-011 · Navigate via the persistent sidebar

**As** any user **I want** a sidebar with links to all major areas **So that** I can move between sections freely

- **Priority:** Must · **Story points:** 2

**Business rules**
- Permanent on desktop (≥ 992px), temporary drawer (hamburger) on mobile.
- Active route is visually highlighted.
- Sidebar items: Dashboard, All Records, Scope 1/2/3 calculators, Reports, Settings, Admin Panel (if permitted).
- Carbonly logo links to `/`.

**Acceptance criteria**
1. **Given** I'm on the dashboard **When** I click "All Records" **Then** I navigate to `/emissions` with the sidebar highlighting that item.
2. **Given** mobile viewport (< 992px) **When** I tap the hamburger **Then** temporary drawer slides in; tapping a link closes the drawer.

---

#### US-012 · Switch role (demo mode)

**As** a demo visitor **I want** to switch between admin and expert views without re-login **So that** I can explore both perspectives

- **Priority:** Could (demo-only) · **Story points:** 2

**Acceptance criteria**
1. **Given** signed in as SUPER_ADMIN on `/admin` **When** I click "Expert View" **Then** session replaced by the expert account and redirected to `/dashboard`.

---

### 9.4 Epic 3 — Emissions Dashboard

**Goal:** Give tenant users instant insight into their carbon footprint.

---

#### US-020 · View total emissions hero panel

**As** Emma **I want** a large "Total Emissions" card **So that** I see the headline number at a glance

- **Priority:** Must · **Story points:** 3

**Business rules**
- Hero shows total tCO₂e for selected year (1 decimal place).
- 12-month sparkline shows monthly distribution.
- Two comparison chips: prior year (YoY %) and baseline year (vs-baseline %).
- Chip colour: green if lower, red if higher.
- No data state: "No data yet — start by logging emissions in the Scope calculators".

**Acceptance criteria**
1. **Given** records totalling 1,248.5 tCO₂e for 2025 **When** I view `/dashboard?year=2025` **Then** hero shows "1,248.5 t CO₂e".
2. **Given** prior year was 1,420 tCO₂e **When** current year is 1,248.5 **Then** YoY chip reads "↓ 12%" in green.
3. **Given** 2025 is the baseline year **Then** no "vs baseline" chip is shown.

---

#### US-021 · View scope breakdown cards

**As** Carlos **I want** individual cards for Scope 1, 2, and 3 **So that** I see where emissions concentrate

- **Priority:** Must · **Story points:** 2

**Business rules**
- Three cards (Bootstrap `col-12 col-md-4`): label, sub-label, tCO₂e, % of total, progress bar.
- Cards are clickable to expand an activity drill-down below.
- Colour coding: Scope 1 green, Scope 2 teal/blue, Scope 3 amber.

**Acceptance criteria**
1. **Given** Scope 2 = 518.4 t of 1,248.5 total **When** card renders **Then** shows "42%" with bar at 42%.
2. **Given** I click Scope 2 **Then** panel shows Scope 2 activities sorted by CO₂e descending.
3. **Given** I click the same card again **Then** panel collapses.

---

#### US-022 · View scope breakdown pie chart

**As** Emma **I want** an interactive pie chart **So that** I have a visual proportion at a glance

- **Priority:** Should · **Story points:** 3

**Business rules**
- Recharts `PieChart` with 3 slices. Hover shows tooltip with tCO₂e. Click slice → drill-down.

---

#### US-023 · View monthly trend chart

**As** Carlos **I want** a 12-month bar chart **So that** I can spot seasonal peaks

- **Priority:** Should · **Story points:** 2

**Business rules**
- Jan–Dec X axis; tCO₂e Y axis. Months with no data show 0 bars. Dashed average reference line. Current month highlighted.

**Acceptance criteria**
1. **Given** viewing 2026 in April **When** chart renders **Then** Jan–Apr show data and May–Dec are 0 bars.

---

#### US-024 · Switch the dashboard year

**As** Emma **I want** to switch between 2021–2026 **So that** I can review historical performance

- **Priority:** Must · **Story points:** 2

**Business rules**
- MUI `ToggleButtonGroup` year picker. 2021 labelled "Baseline" (green dot), 2026 labelled "Current" (amber dot).
- Changing year updates `?year=XXXX` URL and re-renders server component.

**Acceptance criteria**
1. **Given** on `/dashboard?year=2024` **When** I click "2025" **Then** URL changes and all panels refresh.

---

#### US-025 · View top emitting activities

**As** Emma **I want** a table of the top 5 emitting activities **So that** I know where to focus reductions

- **Priority:** Should · **Story points:** 2

**Business rules**
- Ranked by summed tCO₂e descending. Columns: rank badge (#1–#5), activity name, scope chip, tCO₂e, % of total.

---

#### US-026 · View consumption breakdown

**As** Carlos **I want** to see total consumption per unit **So that** I understand activity volumes

- **Priority:** Could · **Story points:** 2

**Business rules**
- Records grouped by `unit`. Each group: total quantity + top 3 contributing activities. Colour-coded unit chips.

---

### 9.5 Epic 4 — Emissions Calculator (Scopes 1–3)

**Goal:** Let users log activity data and have the system compute CO₂e automatically.

---

#### US-030 · Log a Scope 1 emission record

**As** Carlos **I want** to log fuel consumption **So that** our direct emissions are tracked

- **Priority:** Must · **Story points:** 5 · **Dependencies:** US-002

**Validations**

| Field | Rule |
|---|---|
| Activity | Required · must belong to Scope 1 · `isActive = true` |
| Emission factor | Required · must belong to the selected activity |
| Quantity | Required · numeric · > 0 · max 15 significant digits |
| Unit | Required · matches activity default unit (informational) |
| Period | Required · month/year picker · must be ≤ current month |
| Notes | Optional · max 500 chars |

**Business rules**
- CO₂e computed server-side: `co2eKg = quantity × factor.value`; `co2eT = co2eKg / 1000`.
- Rounded: `co2eKg` to 3 decimals, `co2eT` to 6 decimals.
- `EmissionRecord` stores both values (denormalised for fast reads).
- Selected `emissionFactorId` is immutable once saved — admin changes don't affect history.
- Successful save returns 201 with the full record.

**Acceptance criteria**
1. **Given** 12,400 kWh natural gas × DEFRA 2024 factor (0.18316 kgCO₂e/kWh) **When** I submit **Then** `co2eKg = 2,271.18` and `co2eT = 2.27118`.
2. **Given** quantity `-5` **When** I submit **Then** "Quantity must be greater than 0" — no record created.
3. **Given** future period (e.g. 2027-06) **When** I submit **Then** API returns 400 "Period cannot be in the future".
4. **Given** deactivated activity **When** form renders **Then** it doesn't appear in dropdown.

**Edge cases**
- Quantity 0 rejected.
- `Infinity` or `NaN` from DevTools rejected by Zod.

---

#### US-031 · Log a Scope 2 emission record

**As** Carlos **I want** to log monthly grid electricity consumption **So that** purchased-energy emissions reflect the correct grid intensity

- **Priority:** Must · **Story points:** 3

**Business rules**
- Same engine/validation as Scope 1.
- Factor picker defaults to `isDefault` factor but allows alternatives (UK, US, EU).
- Location-based method only in Phase 1.

**Acceptance criteria**
1. **Given** 48,000 kWh × 0.20493 kgCO₂e/kWh (UK DEFRA 2024) **When** I submit **Then** `co2eKg = 9,836.64`.

---

#### US-032 · Log a Scope 3 emission record

**As** Carlos **I want** to log business travel, commuting, purchased goods, and waste **So that** our full value-chain footprint is captured

- **Priority:** Must · **Story points:** 3

**Acceptance criteria**
1. **Given** 24,600 passenger-km long-haul flight × 0.195 kgCO₂e/pkm **When** I submit **Then** `co2eKg = 4,797` and record appears in All Records.

---

#### US-033 · See factor details before saving

**As** Carlos **I want** to see the selected factor's source, region, and value before committing **So that** I don't use the wrong one

- **Priority:** Should · **Story points:** 1

**Acceptance criteria**
1. **Given** I select a factor **When** the side panel updates **Then** I see "Source: DEFRA · Region: UK · Value: 0.20493 kgCO₂e/kWh · GWP: IPCC AR5 100-year".

---

#### US-034 · See a live CO₂e preview

**As** Carlos **I want** the form to show estimated CO₂e before I submit **So that** I can sanity-check the magnitude

- **Priority:** Could · **Story points:** 2

**Acceptance criteria**
1. **Given** factor 0.20493 and quantity 1000 **When** I type **Then** "Preview" chip shows "≈ 204.93 kg CO₂e / 0.205 t CO₂e".

---

### 9.6 Epic 5 — Emission Records Management

**Goal:** Let tenant users review, filter, and manage what's been logged.

---

#### US-040 · View all records

**As** Emma **I want** a paginated, filterable list of every emission record **So that** I can audit my team's entries

- **Priority:** Must · **Story points:** 3

**Business rules**
- 20 records per page. Default sort: `period` descending.
- Columns: Date (period), Scope chip, Activity, Quantity + unit, tCO₂e, Emission factor, User, Data source.
- Scope chips colour-coded consistently.

**Acceptance criteria**
1. **Given** 450 records **When** I visit `/emissions` **Then** I see page 1 of 23, newest first.
2. **Given** I click Scope 2 filter **When** URL updates to `?scope=2` **Then** only Scope 2 records show.

---

#### US-041 · Filter records by year

**As** Emma **I want** to narrow records to a specific year **So that** I can produce period-specific audits

- **Priority:** Should · **Story points:** 1

**Acceptance criteria**
1. **Given** year dropdown on `/emissions` **When** I pick "2025" **Then** URL changes to `?year=2025` and list refreshes.

---

### 9.7 Epic 6 — Reporting

**Goal:** Turn raw records into ISO 14064-aligned annual reports.

---

#### US-050 · Generate an annual report

**As** Emma **I want** to generate a GHG report for a specific year **So that** I can share data with auditors, investors, or regulators

- **Priority:** Must · **Story points:** 8 · **Dependencies:** US-030, US-031, US-032

**Validations**

| Field | Rule |
|---|---|
| Year | Required · 2021 ≤ year ≤ current year · must have ≥ 1 record · no existing report for that year |

**Business rules**
- `POST /api/reports` with `{ year }`.
- API aggregates 4 parallel queries: all records for year, prior-year aggregate, baseline aggregate, entity metadata.
- Aggregated summary stored in `Report.summary` (JSONB).
- `Report.status` set to `GENERATED`.
- Duplicate (entity, year) → 409 Conflict.
- Zero records for year → 422 Unprocessable Entity.

**Summary JSON shape:**
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
  "vsBaselinePct": -31.12
}
```

**Acceptance criteria**
1. **Given** I click "Generate Report" for 2025 **When** API completes **Then** `Report` row created with `status = GENERATED` and detail panel shown inline.
2. **Given** report for 2025 already exists **When** I try again **Then** "A report for 2025 already exists — delete it first".
3. **Given** 2027 has zero records **When** I try to generate **Then** "No emission records found for 2027".

---

#### US-051 · View report detail panel

**As** Emma **I want** to view the full breakdown of a report inline **So that** I can review without downloading

- **Priority:** Must · **Story points:** 5

**Business rules**
- Clicking a report row expands: 4 KPI cards (total, YoY, vs-baseline, data quality), scope bars, 12-month chart, top 5 sources.
- Data quality: High (≥ 50 records), Medium (20–49), Low (< 20).

---

#### US-052 · Export report as CSV

**As** Carlos **I want** to download a report as CSV **So that** I can analyse it in Excel

- **Priority:** Must · **Story points:** 3

**Business rules**
- `GET /api/reports/[id]/export?format=csv` returns `text/csv` with `Content-Disposition: attachment`.
- Filename: `carbonly-ghg-report-{year}.csv`.
- CSV blocks (in order): report header, summary, scope breakdown, activities by scope, monthly trend, top activities, footer credit.
- RFC 4180 escaping for commas, quotes, newlines.

---

#### US-053 · Publish / unpublish a report

**As** Emma **I want** to mark a report as PUBLISHED **So that** I signal internally when the report is ready to share

- **Priority:** Should · **Story points:** 2

**Business rules**
- `PATCH /api/reports/[id]` with `{ status: "PUBLISHED" | "GENERATED" }`. Publish only for GENERATED; unpublish only for PUBLISHED.

---

#### US-054 · Delete a report

**As** Emma **I want** to delete a mistakenly generated report **So that** I can re-generate with corrected data

- **Priority:** Should · **Story points:** 1

**Business rules**
- `DELETE /api/reports/[id]`. `confirm()` dialog warns action is irreversible.

---

### 9.8 Epic 7 — Settings & Profile

**Goal:** Let users review their profile and organisation details.

---

#### US-060 · View my profile

**As** Carlos **I want** to see my name, email, role, and member-since date **So that** I can verify the account I'm using

- **Priority:** Should · **Story points:** 1

---

#### US-061 · View my organisation details

**As** Emma **I want** to see my organisation's name, slug, industry, country, and subscription status **So that** I can confirm the tenant context

- **Priority:** Should · **Story points:** 1

---

#### US-062 · View billing summary

**As** Emma **I want** a Billing section showing my current plan, status, and trial end date **So that** I know where my subscription stands

- **Priority:** Must · **Story points:** 3

**Business rules**
- Plan resolved from `Entity.stripePriceId` via `getPlanByPriceId()`.
- Status chip colour: ACTIVE=green, TRIALING=blue, PAST_DUE=amber, CANCELED=red.
- If `stripeCustomerId` is set, "Manage billing" button opens Stripe Customer Portal.
- If NONE / CANCELED / TRIALING, "Upgrade plan" link routes to `/#pricing`.

**Acceptance criteria**
1. **Given** TRIALING subscription ending 2026-04-30 **When** I visit Settings **Then** I see "Trial ends in 15 days — 30 April 2026".

---

### 9.9 Epic 8 — Billing & Subscriptions

**Goal:** Monetise via Stripe with three tiers and a 14-day trial.

---

#### US-070 · View pricing on the landing page

**As** Priya **I want** to see three plan tiers with features and prices **So that** I can evaluate Carbonly

- **Priority:** Must · **Story points:** 3

**Business rules**
- Three cards: Starter £49/mo, Professional £149/mo (Most Popular badge), Enterprise (custom — contact sales).
- Annual billing option toggles monthly ↔ discounted annual prices.

---

#### US-071 · Start a paid plan via Stripe Checkout

**As** Emma **I want** to click "Start free trial" and go through Stripe Checkout **So that** my organisation starts a 14-day trial

- **Priority:** Must · **Story points:** 5

**Validations**
- User must be authenticated; if not, redirect to `/register`.
- `entityId` must exist.

**Business rules**
- `POST /api/stripe/checkout` with `{ planKey }`:
  1. Ensure Stripe Customer exists; save `stripeCustomerId`.
  2. Create Checkout Session: `mode: "subscription"`, `trial_period_days: 14`, `success_url: /dashboard?upgraded=1`, `cancel_url: /pricing?canceled=1`.
  3. Return `{ url }` for client redirect.
- On success, webhook → `subscriptionStatus = TRIALING`.

**Acceptance criteria**
1. **Given** I click "Start free trial" on Professional **When** API responds **Then** I'm redirected to Stripe Checkout with correct price ID and trial config.
2. **Given** I cancel at Stripe **When** I return **Then** I land on `/pricing?canceled=1` and no subscription was created.

---

#### US-072 · Keep subscription state in sync via webhooks

**As** the system **I want** to mirror Stripe state into the `Entity` table **So that** the UI reflects reality without polling

- **Priority:** Must · **Story points:** 5

**Validations**
- Webhook signature verified with `STRIPE_WEBHOOK_SECRET` via `stripe.webhooks.constructEvent()`.
- Unverified payloads → 400 with no DB writes.

**Business rules — event mapping:**

| Stripe event | Action |
|---|---|
| `customer.subscription.created` | Save `subscriptionStatus`, `stripeSubscriptionId`, `stripePriceId` |
| `customer.subscription.updated` | Same as created |
| `customer.subscription.deleted` | Set `subscriptionStatus = CANCELED` |
| `invoice.payment_failed` | Set `subscriptionStatus = PAST_DUE` |

**Stripe status → Carbonly enum:**

| Stripe | Carbonly |
|---|---|
| trialing | TRIALING |
| active | ACTIVE |
| past_due | PAST_DUE |
| canceled | CANCELED |
| unpaid | UNPAID |
| incomplete / incomplete_expired / paused | PAST_DUE (fallback: CANCELED) |

---

#### US-073 · Open the Stripe Customer Portal

**As** Emma **I want** a "Manage billing" button that opens Stripe's hosted portal **So that** I can update card, view invoices, and change plan

- **Priority:** Must · **Story points:** 2

**Business rules**
- `POST /api/stripe/portal` creates billing portal session with `return_url: /settings`. Returns `{ url }`.

---

### 9.10 Epic 9 — Admin: Entity Management

**Goal:** Let platform admins manage tenant organisations.

---

#### US-080 · View all entities

**As** Adam **I want** a searchable list of every tenant **So that** I can monitor and support them

- **Priority:** Must · **Story points:** 3

**Business rules**
- Table columns: Name, Slug (monospace), Industry, Country, Status chip, Users count, Records count, Created.
- Stat cards: Total, Active, Trialing, Churned.

---

#### US-081 · Create a new entity

**As** Adam **I want** to create a new organisation via a sidesheet form **So that** a new customer is onboarded

- **Priority:** Must · **Story points:** 3

**Validations**

| Field | Rule |
|---|---|
| Name | Required · 2–80 chars |
| Slug | Optional · auto-generated from name if empty · must be unique |
| Industry | Optional · free text |
| Country | Optional · free text |
| Subscription status | Defaults to `TRIALING` |

**Acceptance criteria**
1. **Given** I type "GreenTech Solutions" **When** I submit without a slug **Then** entity created with slug `"greentech-solutions"`.
2. **Given** slug "acme-corp" already exists **When** I submit **Then** "Slug already in use".

---

#### US-082 · Edit an entity

**As** Adam **I want** to edit name, industry, country, or status **So that** I can keep records current

- **Priority:** Must · **Story points:** 2

---

#### US-083 · Delete an entity

**As** Adam **I want** to delete an entity and all its data **So that** I can offboard customers cleanly

- **Priority:** Should · **Story points:** 2

**Business rules**
- Prisma cascade deletes: `UserEntity`, `EmissionRecord`, `Report`, `YearlyConfig`.
- `confirm()` dialog warns "This will remove all users, records and reports".

**Acceptance criteria**
1. **Given** entity with 5 users, 450 records, 2 reports **When** I confirm deletion **Then** all rows removed and stat cards update.

---

### 9.11 Epic 10 — Admin: User Management

---

#### US-090 · View all users

**As** Adam **I want** a list of every registered user **So that** I can audit access

- **Priority:** Must · **Story points:** 2

**Business rules**
- Columns: Name, Email, Role chip, Organisation, Joined. "You" badge on current user.
- Stat cards: Total, Super Admins, Admins, Experts.

---

#### US-091 · Invite (create) a user

**As** Adam **I want** to create a new user and assign them to an entity **So that** they can sign in immediately

- **Priority:** Must · **Story points:** 3

**Validations**

| Field | Rule |
|---|---|
| Name | Optional · ≤ 80 chars |
| Email | Required · valid format · unique |
| Temporary password | Optional · if set, ≥ 8 chars |
| Global role | Required · EXPERT (default), ADMIN, or SUPER_ADMIN |
| Entity | Optional · if set, creates `UserEntity` row |
| Entity role | Required if entity is set · EXPERT (default) or ADMIN |

**Acceptance criteria**
1. **Given** I invite `jane@acme-corp.com` as EXPERT at Acme Corp **When** I submit **Then** user + entity membership created.

---

#### US-092 · Edit a user

**As** Adam **I want** to edit a user's name or global role **So that** I can correct mistakes or promote users

- **Priority:** Must · **Story points:** 2

---

#### US-093 · Delete a user

**As** Adam **I want** to delete a user **So that** I can revoke access

- **Priority:** Must · **Story points:** 1

**Business rules**
- A user cannot delete their own account — API returns 400.
- Cascade deletes: `UserEntity`, `Session`, `Account`.

---

### 9.12 Epic 11 — Admin: Taxonomy Management

---

#### US-100 · View scopes & activities

**As** Adam **I want** to see each scope with its activities **So that** I can maintain the GHG Protocol taxonomy

- **Priority:** Must · **Story points:** 2

**Business rules**
- Three scope sections with coloured headers.
- Row: Activity name, description (truncated), Unit, Equation, Factor count, Active toggle.

---

#### US-101 · Add a new activity

**As** Adam **I want** to add a new activity under a scope **So that** I can keep up with reporting requirements

- **Priority:** Must · **Story points:** 2

**Validations**

| Field | Rule |
|---|---|
| Scope | Required |
| Name | Required · ≤ 120 chars |
| Description | Optional · ≤ 500 chars |
| Unit | Required · ≤ 30 chars |
| Equation | Optional · defaults to "quantity × emissionFactor" |

**Business rules**
- Auto-increments `sortOrder` = max+1 within scope. Defaults to `isActive = true`.

---

#### US-102 · Edit / deactivate an activity

**As** Adam **I want** to update an activity or toggle its active state **So that** I can retire deprecated activities

- **Priority:** Must · **Story points:** 2

**Business rules**
- Deactivated activities hidden from calculator dropdowns; existing records preserved.

---

#### US-103 · Delete an activity

**As** Adam **I want** to delete an activity with no factors **So that** I can clean up unused entries

- **Priority:** Should · **Story points:** 1

**Business rules**
- `DELETE` blocked with 409 if any `EmissionFactor` rows reference the activity.

---

### 9.13 Epic 12 — Admin: Emission Factor Management

---

#### US-110 · View all emission factors

**As** Adam **I want** a master table of every factor **So that** I can audit the taxonomy

- **Priority:** Must · **Story points:** 3

**Business rules**
- Columns: Scope chip, Activity, Factor name, Value (mono), Unit, Source, Region, Default chip.
- Search: filter by factor name, activity name, or source.
- Scope filter dropdown + stats (Total, Defaults, per-scope counts).

---

#### US-111 · Add a new factor

**As** Adam **I want** to add a new factor to an activity **So that** users have the latest regulator-issued values

- **Priority:** Must · **Story points:** 3

**Validations**

| Field | Rule |
|---|---|
| Activity | Required · must be active |
| Factor name | Required · ≤ 120 chars |
| Value | Required · positive number · ≤ 15 significant digits |
| Unit | Required (e.g. "kgCO2e/kWh") |
| Source | Optional |
| Region | Optional (e.g. "UK", "US", "EU") |
| GWP | Optional (e.g. "IPCC AR5 100-year") |
| Is default | Boolean |

**Business rules**
- If `isDefault = true`, API automatically un-defaults all other factors for the same activity.

**Acceptance criteria**
1. **Given** "Grid electricity" has default factor "DEFRA 2023" **When** I add "DEFRA 2024" as default **Then** DEFRA 2023 is automatically un-defaulted in the same transaction.

---

#### US-112 · Edit / toggle-default a factor

**As** Adam **I want** to update a factor's value or toggle its default flag **So that** I can roll over to a new year's factor

- **Priority:** Must · **Story points:** 2

---

#### US-113 · Delete a factor

**As** Adam **I want** to delete a factor not referenced by any records **So that** I can clean up unused entries

- **Priority:** Should · **Story points:** 1

**Business rules**
- Returns 409 Conflict if any `EmissionRecord` rows reference the factor.

---

### 9.14 Epic 13 — Admin: Platform Analytics & Billing Insights

---

#### US-120 · View platform overview

**As** Adam **I want** a dashboard of platform-wide KPIs **So that** I can monitor health at a glance

- **Priority:** Must · **Story points:** 5

**Business rules**
- Hero banner (dark gradient) with welcome message.
- KPI cards: Organisations, Users, Emission Records, CO₂e Tracked (tonnes).
- Subscription status panel (5 tiles), taxonomy summary, recent orgs, recent users, activity feed.

---

#### US-121 · View billing analytics

**As** Adam **I want** revenue-focused analytics (MRR, conversions, trials ending) **So that** I can track SaaS metrics

- **Priority:** Must · **Story points:** 5

**Business rules**
- MRR = sum of `monthlyPrice` across entities with `subscriptionStatus = ACTIVE`.
- Conversion = % of entities currently `ACTIVE`.
- Trials ending = entities `TRIALING` with `trialEndsAt ≤ now + 7 days`.
- Plan distribution bars (Starter / Professional / Enterprise / None).
- Alert banner for trials ending soon.
- Full subscription table: plan, status, trial end, Stripe customer ID (truncated), user count.

**Acceptance criteria**
1. **Given** 3 active professional customers at £149/mo **When** I view `/admin/billing` **Then** MRR reads "£447".

---

### 9.15 Epic 14 — Marketing & Landing Page

---

#### US-130 · View the landing page

**As** Priya **I want** a polished landing page that explains Carbonly in 30 seconds **So that** I decide whether to sign up

- **Priority:** Must · **Story points:** 5

**Business rules**
- Sections: Hero (dark green gradient, typewriter headline) → Trusted-by chips → Animated stats bar → Features grid (6 items) → "How it works" (3-step auto-advance) → Pricing → Testimonials → CTA banner → Footer.
- Sticky nav transitions to frosted glass on scroll.
- Responsive: single column mobile, 2-col tablet, full layout desktop.
- All `/register` and `/login` links functional.

---

#### US-131 · Start free trial from pricing

**As** Priya **I want** "Start free trial" buttons on each plan card **So that** I can sign up directly from pricing

- **Priority:** Must · **Story points:** 2

**Business rules**
- Clicking calls `POST /api/stripe/checkout`; if unauthenticated (401), redirect to `/register`.
- Enterprise CTA opens `mailto:sales@carbonly.io?subject=Enterprise enquiry`.

---

## 10. Cross-cutting Acceptance Criteria

The following acceptance criteria apply to **every** story in this document:

### 10.1 Security

| # | Criterion |
|---|-----------|
| SEC-01 | No tenant data is ever returned or mutated without filtering by `entityId` from the session |
| SEC-02 | All destructive admin actions require `confirm()` on the client |
| SEC-03 | Stripe webhooks are signature-verified before any DB mutation |
| SEC-04 | No secret (Stripe key, NextAuth secret, DB password) is exposed in the client bundle |
| SEC-05 | Server-sent HTML escapes all user-supplied strings (React defaults) |
| SEC-06 | Middleware enforces auth at the edge — no route can be accessed with an invalid/missing session |

### 10.2 Error Handling

| # | Criterion |
|---|-----------|
| ERR-01 | All API routes return `{ error: string }` JSON with appropriate 4xx/5xx status |
| ERR-02 | Client UI displays errors using MUI `Alert` components or inline helper text |
| ERR-03 | Network failures show "Network error — please try again" |
| ERR-04 | 500-level errors are logged server-side (Prisma error at `error` level in production) |

### 10.3 Accessibility

| # | Criterion |
|---|-----------|
| A11Y-01 | All interactive elements are keyboard accessible (Tab order, Enter/Space to activate) |
| A11Y-02 | Form inputs have associated `<label>` elements |
| A11Y-03 | Colour is never the sole indicator of state (badges include text + icon) |
| A11Y-04 | Focus rings are visible on all focusable elements |

### 10.4 Performance

| # | Criterion |
|---|-----------|
| PERF-01 | Initial page load ≤ 1.5s on fast 3G |
| PERF-02 | Dashboard data query ≤ 50ms on ~2,000 records |
| PERF-03 | All pages use server components; no client-side data fetch on first load |

### 10.5 Responsive Design

| # | Criterion |
|---|-----------|
| RESP-01 | All pages render correctly at 375px (mobile), 768px (tablet), 1280px (desktop) |
| RESP-02 | Admin tables support horizontal scroll on narrow viewports (`table-responsive`) |
| RESP-03 | Sidebar is permanent drawer on ≥ 992px; temporary hamburger drawer below |

### 10.6 Data Integrity

| # | Criterion |
|---|-----------|
| DATA-01 | All FK relationships use cascading delete where ownership is clear |
| DATA-02 | Emission factor references in `EmissionRecord` are immutable post-creation |
| DATA-03 | All CO₂e calculations are performed server-side; client inputs are never trusted |
| DATA-04 | `EmissionRecord` captures `userId`, `dataSource`, and `createdAt` for full auditability |

---

## 11. Requirements Traceability Matrix

Each functional requirement is covered by one or more user stories:

| BRD Ref | Requirement | User stories |
|---------|-------------|-------------|
| FR-AUTH-01 | Email/password + Google auth | US-001, US-002, US-003 |
| FR-AUTH-02 | Session expiry | US-005 |
| FR-AUTH-03 | SUPER_ADMIN platform access | US-080 – US-121 |
| FR-AUTH-04 | Entity ADMIN manages their entity | US-061, US-062, US-073 |
| FR-AUTH-05 | EXPERT scoped to assigned entity | US-030, US-031, US-032 |
| FR-AUTH-06 | Onboarding redirect | US-010 |
| FR-AUTH-07 | Middleware edge auth | US-005 |
| FR-AUTH-08 | bcryptjs password hashing | US-001 (business rules) |
| FR-CALC-01 | Scope 1/2/3 calculators | US-030, US-031, US-032 |
| FR-CALC-02 | Activity + factor selection | US-033 |
| FR-CALC-03 | `CO2e = quantity × factor` | US-030 (business rules) |
| FR-CALC-04 | Store kg + tonnes | US-030 (business rules) |
| FR-CALC-05 | Capture period + notes | US-030 (validations) |
| FR-CALC-06 | Factor source/region/GWP | US-033, US-110 |
| FR-CALC-07 | Immutable factor reference | US-030 (business rules) |
| FR-CALC-08 | No future periods | US-030 (AC-3) |
| FR-CALC-09 | Server-side calculation | §10.6 DATA-03 |
| FR-DASH-01 | Total by scope hero | US-020, US-021 |
| FR-DASH-02 | Donut/pie chart | US-022 |
| FR-DASH-03 | Monthly trend chart | US-023 |
| FR-DASH-04 | Top 5 activities | US-025 |
| FR-DASH-05 | Year selection | US-024 |
| FR-DASH-06 | YoY + vs-baseline | US-020 |
| FR-DASH-07 | Scope drill-down | US-021 |
| FR-DASH-08 | Consumption breakdown | US-026 |
| FR-DASH-09 | RSC-first rendering | §10.4 PERF-03 |
| FR-ENT-01 | Entity CRUD | US-080, US-081, US-082, US-083 |
| FR-ENT-02 | Unique slug | US-081 (validations) |
| FR-ENT-03 | Edit entity profile | US-082 |
| FR-ENT-04 | Stripe subscription mirror | US-072 |
| FR-ENT-05 | Entity cascade delete | US-083 |
| FR-USR-01 | View all users | US-090 |
| FR-USR-02 | Invite/create user | US-091 |
| FR-USR-03 | Change role | US-092 |
| FR-USR-04 | Delete user (no self-delete) | US-093 |
| FR-SCOPE-01 | Activity CRUD | US-100, US-101, US-102, US-103 |
| FR-SCOPE-02 | Activity metadata | US-101 (validations) |
| FR-SCOPE-03 | Block delete if factors exist | US-103 |
| FR-SCOPE-04 | Deactivation preserves history | US-102 |
| FR-EF-01 | Factor CRUD | US-110, US-111, US-112, US-113 |
| FR-EF-02 | Single default per activity | US-111 (business rules) |
| FR-EF-03 | Auto-undefault on new default | US-111 (AC-1) |
| FR-EF-04 | Block delete if records exist | US-113 |
| FR-PAY-01 | Three subscription plans | US-070 |
| FR-PAY-02 | Stripe Checkout + 14-day trial | US-071 |
| FR-PAY-03 | Webhook status sync | US-072 |
| FR-PAY-04 | Lapsed → billing redirect | US-062 |
| FR-PAY-05 | Stripe Customer Portal | US-073 |
| FR-PAY-06 | Webhook signature verification | US-072 (validations) |
| FR-RPT-01 | Generate annual report | US-050 |
| FR-RPT-02 | Scope + activity breakdown | US-051 |
| FR-RPT-03 | CSV export | US-052 |
| FR-RPT-04 | Status lifecycle | US-053 |
| FR-RPT-05 | Block duplicate report | US-050 (AC-2) |
| FR-RPT-06 | 422 on zero records | US-050 (AC-3) |
| NFR-01 | Tenant isolation | §10.1 SEC-01 |
| NFR-02 | RSC-first rendering | §10.4 PERF-03 |
| NFR-03 | Performance thresholds | §10.4 PERF-01, PERF-02 |
| NFR-04 | 99.9% availability | §7 (Enterprise SLA) |
| NFR-05 | 500+ entity scalability | Shared schema architecture |
| NFR-06 | Audit fields | US-030, §10.6 DATA-04 |
| NFR-07 | Factor traceability | US-110, US-111 |
| NFR-08 | Accessibility | §10.3 |
| NFR-09 | Responsive design | §10.5 |
| NFR-10 | Immutable factor refs | §10.6 DATA-02 |
| NFR-11 | Structured error responses | §10.2 ERR-01 |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **GHG** | Greenhouse Gas |
| **CO₂e** | Carbon Dioxide equivalent — standard unit for measuring carbon footprints |
| **tCO₂e** | Metric tonnes of CO₂ equivalent |
| **Scope 1** | Direct emissions from owned or controlled sources (combustion, fugitive) |
| **Scope 2** | Indirect emissions from purchased energy (electricity, heat, steam) |
| **Scope 3** | All other indirect emissions in the value chain (travel, goods, waste) |
| **EF** | Emission Factor — the CO₂e emitted per unit of activity (e.g. kgCO₂e/kWh) |
| **GWP** | Global Warming Potential — multiplier for converting non-CO₂ gases to CO₂e |
| **Entity** | A tenant organisation on the Carbonly platform |
| **RSC** | React Server Component — a Next.js 13+ component that renders server-side only |
| **JWT** | JSON Web Token — the session format used by NextAuth v5 |
| **MRR** | Monthly Recurring Revenue |
| **SUPER_ADMIN** | Platform-level administrator with access to all entities |
| **ADMIN** | Entity-level administrator managing one or more organisations |
| **EXPERT** | Carbon expert end user who enters and reviews emission data |
| **YoY** | Year-over-year change expressed as a percentage |
| **GHG Protocol** | The Greenhouse Gas Protocol Corporate Accounting and Reporting Standard |
| **DEFRA** | UK Department for Environment, Food & Rural Affairs — source of UK emission factors |
| **EPA** | US Environmental Protection Agency — source of US emission factors |
| **IPCC AR5** | IPCC Fifth Assessment Report — GWP values (100-year time horizon) |
| **TCFD** | Task Force on Climate-related Financial Disclosures |
| **CDP** | Carbon Disclosure Project |
| **EU CSRD** | EU Corporate Sustainability Reporting Directive |
| **SaaS** | Software as a Service |
| **MoSCoW** | Prioritisation framework: Must / Should / Could / Won't |

---

*Document version 2.0 — © 2026 Carbonly. All rights reserved.*
