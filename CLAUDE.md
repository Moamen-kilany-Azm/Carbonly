# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Database
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:migrate   # Run migrations (creates new migration file)
npm run db:seed      # Seed with demo data (scopes, activities, emission factors, demo users)
npm run db:studio    # Open Prisma Studio GUI

# Build & Lint
npm run build        # Production build
npm run lint         # ESLint
```

Copy `.env.local.example` to `.env.local` and fill in values before running.

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · Material UI (MUI) · Bootstrap 5 · Prisma (PostgreSQL) · NextAuth v5 · Stripe · Recharts

### Route Groups

- `(auth)` — `/login`, `/register` — minimal centered layout, no session required
- `(dashboard)` — `/dashboard`, `/scope/[1|2|3]`, `/emissions`, `/reports`, `/settings` — sidebar + topbar shell, requires session + `entityId`
- `(admin)` — `/admin/**` — dark admin sidebar, requires `globalRole === SUPER_ADMIN`

### Multi-Tenancy

Every user belongs to an `Entity` (tenant) via `UserEntity`. The session JWT carries `entityId`, `entitySlug`, and `entityRole`. All DB queries in dashboard routes must filter by `entityId`. The middleware at `src/middleware.ts` enforces auth and role guards at the route level — it must remain consistent with layout-level guards.

### Calculation Engine

`src/lib/calculator/engine.ts` is pure TypeScript with no I/O. The formula is:

```
CO2e (kg) = quantity × emissionFactor.value
CO2e (t)  = CO2e (kg) / 1000
```

When creating an `EmissionRecord` via the API route, always call `calculate()` from the engine before writing to the DB — never compute inline.

### Roles

| `globalRole` | Access |
|---|---|
| `SUPER_ADMIN` | Platform admin panel + all entities |
| `ADMIN` | Entity admin (manages users, config) |
| `EXPERT` | Carbon Expert — can create/view emission records |

Role is checked at three layers: middleware → layout `redirect()` → server action/API `401/403`.

### Data Model Key Points

- `Scope` → `Activity` → `EmissionFactor` is the taxonomy (seeded, admin-managed)
- `EmissionRecord` denormalizes `year` and `month` for fast aggregation queries
- `EmissionFactor.isDefault = true` marks the factor pre-selected in the calculator UI
- `YearlyConfig` anchors entity-specific emission factor overrides to a calendar year
- Stripe subscription state lives on `Entity` and is updated exclusively via the webhook at `/api/webhooks/stripe`

### Prisma Client Location

The generated client is at `src/generated/prisma` (not the default). Import as:

```ts
import { PrismaClient } from "@/generated/prisma";
```

Use the singleton from `src/lib/db/prisma.ts` in all app code.

### Environment Variables

Required: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`
Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
OAuth (optional): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
