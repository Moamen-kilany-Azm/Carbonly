# Technical Architecture
## Carbonly — Carbon Emissions Management SaaS

---

## 1. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router) | RSC for server-rendered dashboard; file-based routing; built-in API routes |
| Language | TypeScript | End-to-end type safety via shared Zod schemas and Prisma types |
| Styling | Tailwind CSS v4 | Utility-first; fast iteration; no CSS bundle bloat |
| UI Components | Radix UI primitives | Accessible, unstyled headless components wired to Tailwind |
| ORM | Prisma v7 | Type-safe DB client; migration tooling; Prisma Studio for admin |
| Database | PostgreSQL (Neon/Supabase) | Serverless-compatible; full JSONB support for report summaries |
| Auth | NextAuth v5 (Auth.js) | JWT strategy; Prisma adapter; credentials + Google OAuth |
| Payments | Stripe | Hosted checkout; webhooks for subscription state sync |
| Charts | Recharts | React-native; composable; SSR-safe with `"use client"` boundaries |
| Validation | Zod | Shared between API route inputs and React Hook Form resolvers |
| Forms | React Hook Form | Performant; integrates with Zod via `@hookform/resolvers` |
| State | Zustand | Lightweight client state only (e.g. calculator draft) |
| Deployment | Vercel | Zero-config Next.js deployment; edge middleware support |

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│   ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│   │  Auth Pages  │  │  Dashboard (RSC) │  │  Admin Panel   │   │
│   │  /login      │  │  /dashboard      │  │  /admin/**     │   │
│   │  /register   │  │  /scope/[1|2|3]  │  │                │   │
│   └──────────────┘  └──────────────────┘  └────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                    NEXT.JS SERVER (Vercel)                       │
│                                                                  │
│  middleware.ts ──▶ auth check + role guard + tenant context      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  React Server Components (RSC)                          │    │
│  │  - Fetch data directly via Prisma (no HTTP round-trip)  │    │
│  │  - Pass pre-aggregated props to client chart components │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  API Routes                                             │    │
│  │  POST /api/emissions    – create record (+ calculate)   │    │
│  │  GET  /api/emissions    – list records                  │    │
│  │  POST /api/auth/register – create user                  │    │
│  │  POST /api/webhooks/stripe – handle Stripe events       │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼──────────┐              ┌───────────▼──────────┐
│   PostgreSQL        │              │   Stripe             │
│   (Neon/Supabase)   │              │   - Checkout         │
│   - Prisma ORM      │              │   - Webhooks         │
│   - Shared schema   │              │   - Customer Portal  │
│   - Row isolation   │              └──────────────────────┘
│     via entityId    │
└─────────────────────┘
```

---

## 3. Database Schema Overview

```
Entity (tenant)
  ├─ UserEntity (M:M join, adds EntityRole)
  │    └─ User (auth, globalRole)
  ├─ YearlyConfig (per year, anchors EF overrides)
  ├─ EmissionRecord (the core fact table)
  │    ├─ Activity ──▶ Scope (1, 2, 3)
  │    └─ EmissionFactor (versioned, source-tagged)
  └─ Report (generated summaries)
```

**Indexing strategy:**
- `EmissionRecord(entityId, year)` — primary filter for all dashboard queries
- `EmissionRecord(entityId, activityId)` — for activity-level aggregations
- `EmissionFactor(activityId)` — for factor lookup in calculator

---

## 4. Multi-Tenancy

**Pattern:** Shared database, shared schema with `entityId` discriminator.

**Isolation layers:**

1. **Middleware** (`src/middleware.ts`) — reads JWT; blocks unauthenticated requests; checks `globalRole` for admin routes
2. **Layout guards** — server-side `redirect()` if session lacks `entityId` or required role
3. **Data layer** — every Prisma query for tenant-scoped data includes `where: { entityId: session.user.entityId }`. No exceptions.

The `entityId` and `entityRole` are embedded in the JWT at login and refreshed on every token rotation from the `UserEntity` table.

---

## 5. Authentication Flow

```
User submits credentials
       │
       ▼
CredentialsProvider.authorize()
  └─ Hash-compare password with bcryptjs
       │
       ▼
jwt() callback
  └─ Attach globalRole, entityId, entitySlug, entityRole from DB
       │
       ▼
session() callback
  └─ Forward custom fields to Session object
       │
       ▼
Client receives typed Session
  └─ session.user.{ id, globalRole, entityId, entitySlug, entityRole }
```

---

## 6. Calculation Engine

Location: `src/lib/calculator/engine.ts`

The engine is a **pure function module** — no imports from Prisma, no HTTP calls.

```typescript
calculate({ quantity, emissionFactorValue }) → { co2eKg, co2eT }
```

**Formula (GHG Protocol):**
```
CO2e (kg) = Activity Data (unit) × Emission Factor (kgCO2e / unit)
CO2e (t)  = CO2e (kg) / 1000
```

All scope-specific functions (`calculateScope1`, `calculateScope2`, `calculateScope3`) delegate to the same `calculate()` base. Scope differentiation is handled by the emission factor selection, not by distinct formulas, in line with GHG Protocol methodology.

**Testing:** The engine is independently testable with Vitest — no test database or mocking needed.

---

## 7. API Design

All mutations use **Next.js API Routes** for external callability (webhooks, future integrations).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Create user account |
| GET | `/api/auth/[...nextauth]` | — | NextAuth handler |
| POST | `/api/auth/[...nextauth]` | — | NextAuth handler |
| GET | `/api/emissions?year=` | EXPERT | List records for entity |
| POST | `/api/emissions` | EXPERT | Create + calculate record |
| DELETE | `/api/emissions/[id]` | EXPERT | Delete record |
| POST | `/api/webhooks/stripe` | Stripe sig | Handle subscription events |

**Request/response contract:** Zod schemas in `src/lib/validations/` define the contract. The same schema is used by both the API route (server-side parse) and React Hook Form (client-side validation).

---

## 8. Stripe Integration

```
Entity created
  └─ Stripe Customer created → stripeCustomerId stored on Entity

User clicks "Subscribe"
  └─ Redirect to Stripe Checkout (hosted page)
       │ success
       ▼
Stripe fires customer.subscription.created webhook
  └─ /api/webhooks/stripe verifies signature
  └─ Updates Entity: subscriptionStatus, stripeSubscriptionId, stripePriceId

Payment fails
  └─ Stripe fires invoice.payment_failed
  └─ Entity status → PAST_DUE → user redirected to billing page

Subscription cancelled
  └─ Entity status → CANCELED → access blocked
```

The webhook is the **only** place subscription status is updated. Never trust client-side Stripe redirect alone.

---

## 9. Emission Factor Versioning

Emission factors change annually (DEFRA, EPA publish new values each year). The resolution order when creating a record:

1. **Entity-year override** — `EmissionFactor` linked to `YearlyConfig` for the entity's current year
2. **Global default for year** — `EmissionFactor.isDefault = true` with no `yearlyConfigId`
3. **Latest global default** — fallback to most recently added default factor for the activity

Once an `EmissionRecord` is created, it stores `emissionFactorId` as an immutable reference. Historical records always reflect the factor used at time of entry.

---

## 10. Dashboard Data Strategy

The dashboard page is a **React Server Component** that calls Prisma directly:

```typescript
// Server-side aggregation (no client fetch)
const records = await prisma.emissionRecord.findMany({
  where: { entityId, year },
  include: { activity: { include: { scope: true } } }
});

// Aggregate in-memory for the current year's dataset
const byScope = records.reduce(...);
const byMonth = Array.from({ length: 12 }, ...);
```

Chart components (`ScopeBreakdownChart`, `MonthlyTrendChart`) are `"use client"` components that receive pre-aggregated data as props. No client-side fetching on initial render.

Year filter changes trigger a Next.js navigation with updated `searchParams`, re-running the RSC.

---

## 11. Security Considerations

| Risk | Mitigation |
|------|-----------|
| IDOR (accessing another tenant's data) | All queries filtered by `entityId` from session; enforced at DB query level |
| Privilege escalation | `globalRole` stored in DB, embedded in JWT, checked in middleware AND layouts |
| Stripe webhook spoofing | Signature verified with `stripe.webhooks.constructEvent()` before any DB writes |
| Password storage | bcryptjs with cost factor 10 (≈100ms hash time) |
| SQL injection | Prisma parameterizes all queries — no raw SQL in application code |
| XSS | React's default JSX escaping; no `dangerouslySetInnerHTML` in application code |

---

## 12. File Structure Reference

```
src/
├── app/
│   ├── (auth)/          # login, register — no sidebar
│   ├── (dashboard)/     # main app — sidebar layout, entity-scoped
│   │   ├── dashboard/   # overview page (RSC)
│   │   ├── scope/[n]/   # calculator for scope 1, 2, 3
│   │   ├── emissions/   # records list
│   │   └── reports/
│   ├── (admin)/         # platform admin — SUPER_ADMIN only
│   │   └── admin/
│   │       ├── entities/
│   │       ├── users/
│   │       ├── scopes/
│   │       ├── emission-factors/
│   │       └── billing/
│   └── api/
│       ├── auth/        # NextAuth + registration
│       ├── emissions/   # CRUD + calculation
│       └── webhooks/stripe/
├── components/
│   ├── auth/            # LoginForm, RegisterForm (client)
│   ├── layout/          # Sidebar, AdminSidebar, Topbar
│   ├── dashboard/       # Charts and summary cards (client)
│   └── calculator/      # ScopeCalculator form (client)
├── lib/
│   ├── auth/auth.ts     # NextAuth config
│   ├── calculator/      # Pure calculation engine
│   ├── db/prisma.ts     # Prisma singleton
│   ├── stripe/          # Stripe client + plan config
│   ├── utils/format.ts  # CO2e formatting helpers
│   └── validations/     # Zod schemas
├── middleware.ts        # Route guards + tenant context
└── types/next-auth.d.ts # Extended Session type
prisma/
├── schema.prisma        # Full data model
└── seed.ts              # Demo data (scopes, activities, EFs, users)
```

---

## 13. Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, STRIPE_* keys

# 3. Run database migrations
npm run db:migrate

# 4. Generate Prisma client
npm run db:generate

# 5. Seed demo data
npm run db:seed

# 6. Start development server
npm run dev
```

Demo credentials after seeding:
- Admin: `admin@carbonly.io` / `admin1234`
- Expert: `expert@acme-corp.com` / `expert1234`
