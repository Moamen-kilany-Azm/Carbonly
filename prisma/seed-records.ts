/**
 * seed-records.ts
 * Generates 20 records per activity per year for Acme Corp (2021-2026)
 * and GreenTech Solutions (2023-2026).
 *
 * 20 records/year = bi-monthly in 8 months (day-1 + day-16 entries)
 *                 + monthly in 4 quieter months.
 *
 * Decarbonisation arc for Acme Corp:
 *   2021 — baseline peak
 *   2022 — LED retrofit, hybrid vehicles
 *   2023 — solar PV, remote-work policy
 *   2024 — heat pump pilot, EV fleet begins
 *   2025 — EV fleet complete, onsite renewables expanded
 *   2026 — Jan–Apr only (current year), further grid decarbonisation
 *
 * Run: npx tsx prisma/seed-records.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Seasonal patterns (index 0 = Jan … 11 = Dec) ─────────────────────────────
const WINTER = [1.45, 1.35, 1.10, 0.85, 0.70, 0.65, 0.60, 0.65, 0.75, 0.90, 1.15, 1.40];
const FLAT   = [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00];
const SUMMER = [0.70, 0.75, 0.85, 1.00, 1.10, 1.20, 1.25, 1.20, 1.05, 0.90, 0.80, 0.70];
const TRAVEL = [0.60, 0.90, 1.05, 1.00, 1.10, 0.80, 0.50, 0.80, 1.10, 1.20, 1.05, 0.90];

// Which months get TWO entries (bi-monthly). 4 months get only one.
// Picked so that high-volume months get the extra data point.
// Months are 1-based. Total: 8×2 + 4×1 = 20 records per activity per year.
const BI_MONTHS = new Set([1, 3, 4, 6, 7, 9, 10, 12]); // 8 months × 2 = 16
// Remaining months (2,5,8,11) get 1 record each = 4

type ActivityCfg = { baseQty: number; pattern: number[]; jitter: number };

// ── Acme Corp config (large UK manufacturer) ──────────────────────────────────
const ACME_CONFIG: Record<string, ActivityCfg> = {
  "Stationary Combustion — Natural Gas":              { baseQty: 78_000, pattern: WINTER, jitter: 0.08 },
  "Stationary Combustion — Diesel":                   { baseQty:    680, pattern: WINTER, jitter: 0.10 },
  "Mobile Combustion — Company Vehicles (Petrol)":    { baseQty:  1_150, pattern: FLAT,   jitter: 0.10 },
  "Fugitive Emissions — Refrigerants (R-410A)":       { baseQty:    2.4, pattern: SUMMER, jitter: 0.15 },
  "Purchased Electricity":                            { baseQty: 58_000, pattern: WINTER, jitter: 0.06 },
  "Purchased Heat / Steam":                           { baseQty: 26_000, pattern: WINTER, jitter: 0.09 },
  "Business Travel — Domestic Flight":                { baseQty:  8_500, pattern: TRAVEL, jitter: 0.15 },
  "Business Travel — International Long-Haul Flight": { baseQty: 42_000, pattern: TRAVEL, jitter: 0.18 },
  "Employee Commuting — Car":                         { baseQty: 95_000, pattern: FLAT,   jitter: 0.05 },
  "Purchased Goods — Paper":                          { baseQty:   0.90, pattern: FLAT,   jitter: 0.12 },
  "Waste — Landfill (Mixed Waste)":                   { baseQty:   3.60, pattern: FLAT,   jitter: 0.10 },
};

// ── GreenTech Solutions config (smaller UK tech firm) ─────────────────────────
const GREENTECH_CONFIG: Record<string, ActivityCfg> = {
  "Stationary Combustion — Natural Gas":              { baseQty: 12_000, pattern: WINTER, jitter: 0.09 },
  "Stationary Combustion — Diesel":                   { baseQty:     80, pattern: WINTER, jitter: 0.12 },
  "Mobile Combustion — Company Vehicles (Petrol)":    { baseQty:    210, pattern: FLAT,   jitter: 0.11 },
  "Fugitive Emissions — Refrigerants (R-410A)":       { baseQty:   0.50, pattern: SUMMER, jitter: 0.20 },
  "Purchased Electricity":                            { baseQty: 18_500, pattern: WINTER, jitter: 0.07 },
  "Purchased Heat / Steam":                           { baseQty:  6_200, pattern: WINTER, jitter: 0.10 },
  "Business Travel — Domestic Flight":                { baseQty:  2_100, pattern: TRAVEL, jitter: 0.16 },
  "Business Travel — International Long-Haul Flight": { baseQty: 11_000, pattern: TRAVEL, jitter: 0.20 },
  "Employee Commuting — Car":                         { baseQty: 22_000, pattern: FLAT,   jitter: 0.06 },
  "Purchased Goods — Paper":                          { baseQty:   0.18, pattern: FLAT,   jitter: 0.14 },
  "Waste — Landfill (Mixed Waste)":                   { baseQty:   0.70, pattern: FLAT,   jitter: 0.12 },
};

// ── Year-on-year improvement multipliers (compound) ───────────────────────────
// Each entry multiplies ON TOP of all previous years.
const ACME_YEAR_SCALE: Record<number, Record<string, number>> = {
  2021: {},
  2022: {
    "Purchased Electricity":                            0.94,
    "Mobile Combustion — Company Vehicles (Petrol)":   0.92,
    "Business Travel — International Long-Haul Flight": 0.88,
    "Purchased Goods — Paper":                          0.92,
  },
  2023: {
    "Purchased Electricity":                            0.86,
    "Employee Commuting — Car":                         0.78,
    "Business Travel — Domestic Flight":                0.85,
    "Business Travel — International Long-Haul Flight": 0.90,
    "Purchased Goods — Paper":                          0.76,
    "Waste — Landfill (Mixed Waste)":                   0.88,
  },
  2024: {
    "Stationary Combustion — Natural Gas":              0.82,
    "Stationary Combustion — Diesel":                   0.85,
    "Mobile Combustion — Company Vehicles (Petrol)":   0.72,
    "Purchased Electricity":                            0.88,
    "Employee Commuting — Car":                         0.88,
    "Waste — Landfill (Mixed Waste)":                   0.80,
  },
  2025: {
    "Stationary Combustion — Natural Gas":              0.88,
    "Stationary Combustion — Diesel":                   0.80,
    "Mobile Combustion — Company Vehicles (Petrol)":   0.65,
    "Purchased Electricity":                            0.84,
    "Purchased Heat / Steam":                           0.90,
    "Employee Commuting — Car":                         0.85,
    "Business Travel — Domestic Flight":                0.88,
    "Business Travel — International Long-Haul Flight": 0.85,
    "Waste — Landfill (Mixed Waste)":                   0.75,
    "Purchased Goods — Paper":                          0.70,
  },
  2026: {
    "Purchased Electricity":                            0.88,
    "Stationary Combustion — Natural Gas":              0.92,
    "Mobile Combustion — Company Vehicles (Petrol)":   0.80,
    "Employee Commuting — Car":                         0.90,
  },
};

const GREENTECH_YEAR_SCALE: Record<number, Record<string, number>> = {
  2023: {},
  2024: {
    "Purchased Electricity":                            0.88,
    "Employee Commuting — Car":                         0.82,
    "Business Travel — Domestic Flight":                0.90,
    "Purchased Goods — Paper":                          0.80,
  },
  2025: {
    "Purchased Electricity":                            0.82,
    "Employee Commuting — Car":                         0.75,
    "Business Travel — International Long-Haul Flight": 0.85,
    "Mobile Combustion — Company Vehicles (Petrol)":   0.78,
    "Waste — Landfill (Mixed Waste)":                   0.85,
  },
  2026: {
    "Purchased Electricity":                            0.90,
    "Employee Commuting — Car":                         0.92,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function pseudo(seed: number): number {
  return Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
}

function qty(base: number, seasonal: number, scale: number, jitter: number, seed: number): number {
  const noise = (pseudo(seed) - 0.5) * 2 * jitter;
  return Math.max(base * seasonal * scale * (1 + noise), 0.001);
}

function cumulativeScale(
  name: string,
  year: number,
  scales: Record<number, Record<string, number>>
): number {
  let s = 1.0;
  for (const y of Object.keys(scales).map(Number).sort()) {
    if (y > year) break;
    s *= scales[y]?.[name] ?? 1.0;
  }
  return s;
}

// Build list of (month, day, splitFraction) for 20 records per year
// BI_MONTHS get 2 entries: day-1 (60%) and day-16 (40%)
// Non-BI_MONTHS get 1 entry: day-1 (100%)
function recordSlots(maxMonth: number): { month: number; day: number; fraction: number }[] {
  const slots: { month: number; day: number; fraction: number }[] = [];
  for (let m = 1; m <= maxMonth; m++) {
    if (BI_MONTHS.has(m)) {
      slots.push({ month: m, day: 1,  fraction: 0.60 });
      slots.push({ month: m, day: 16, fraction: 0.40 });
    } else {
      slots.push({ month: m, day: 1,  fraction: 1.00 });
    }
  }
  return slots;
}

type ActivityRow = {
  id: string;
  name: string;
  unit: string;
  emissionFactors: { id: string; value: number }[];
};

async function seedForEntity(
  entityId: string,
  userId: string,
  activities: ActivityRow[],
  config: Record<string, ActivityCfg>,
  yearScales: Record<number, Record<string, number>>,
  yearMonthLimit: Record<number, number>, // year → last month to include
  label: string
) {
  const years = Object.keys(yearMonthLimit).map(Number).sort();

  const del = await prisma.emissionRecord.deleteMany({
    where: { entityId, year: { in: years } },
  });
  if (del.count > 0) console.log(`  [${label}] Cleared ${del.count} existing records`);

  let total = 0;

  for (const year of years) {
    const maxMonth = yearMonthLimit[year];
    const slots = recordSlots(maxMonth);
    let yearCount = 0;

    for (const activity of activities) {
      const cfg = config[activity.name];
      if (!cfg) continue;
      const factor = activity.emissionFactors[0];
      if (!factor) continue;

      const scale = cumulativeScale(activity.name, year, yearScales);

      for (const slot of slots) {
        const seasonal = cfg.pattern[slot.month - 1];
        const seed = activity.id.charCodeAt(0) * 7 + year * 31 + slot.month * 37 + slot.day;
        const baseQty = qty(cfg.baseQty, seasonal, scale, cfg.jitter, seed);
        const quantity = baseQty * slot.fraction;

        const co2eKg = quantity * factor.value;
        const co2eT  = co2eKg / 1000;
        const period = new Date(`${year}-${String(slot.month).padStart(2, "0")}-${String(slot.day).padStart(2, "0")}`);

        await prisma.emissionRecord.create({
          data: {
            entityId,
            userId,
            activityId:       activity.id,
            emissionFactorId: factor.id,
            quantity:   parseFloat(quantity.toFixed(4)),
            unit:       activity.unit,
            period,
            year,
            month:      slot.month,
            co2eKg:     parseFloat(co2eKg.toFixed(6)),
            co2eT:      parseFloat(co2eT.toFixed(9)),
            dataSource: "MANUAL",
            notes: `Demo — ${activity.name} (${period.toLocaleString("en", { month: "short" })} ${year})`,
          },
        });
        yearCount++;
        total++;
      }
    }

    const recordsPerActivity = slots.length;
    console.log(`  [${label}] ${year} — ${yearCount} records (${recordsPerActivity}/activity, ${maxMonth} months)`);
  }

  return total;
}

async function main() {
  console.log("Seeding emission records…\n");

  // ── Acme Corp ──────────────────────────────────────────────────────────────
  const acme = await prisma.entity.findUnique({ where: { slug: "acme-corp" } });
  if (!acme) throw new Error("'acme-corp' not found — run db:seed first");

  const acmeUser = await prisma.user.findUnique({ where: { email: "expert@acme-corp.com" } });
  if (!acmeUser) throw new Error("'expert@acme-corp.com' not found");

  // Ensure yearly configs for all years
  for (const year of [2021, 2022, 2023, 2024, 2025, 2026]) {
    await prisma.yearlyConfig.upsert({
      where: { entityId_year: { entityId: acme.id, year } },
      update: {},
      create: { entityId: acme.id, year, baselineYear: year === 2021 },
    });
  }

  // ── GreenTech Solutions ────────────────────────────────────────────────────
  const greentech = await prisma.entity.upsert({
    where: { slug: "greentech-solutions" },
    update: {},
    create: {
      name: "GreenTech Solutions",
      slug: "greentech-solutions",
      industry: "Technology",
      country: "UK",
      subscriptionStatus: "ACTIVE",
    },
  });

  const greentechHash = await bcrypt.hash("green1234", 10);
  const greentechUser = await prisma.user.upsert({
    where: { email: "expert@greentech.io" },
    update: {},
    create: {
      email: "expert@greentech.io",
      name: "GreenTech Expert",
      passwordHash: greentechHash,
      globalRole: "EXPERT",
    },
  });
  await prisma.userEntity.upsert({
    where: { userId_entityId: { userId: greentechUser.id, entityId: greentech.id } },
    update: {},
    create: { userId: greentechUser.id, entityId: greentech.id, role: "EXPERT" },
  });

  for (const year of [2023, 2024, 2025, 2026]) {
    await prisma.yearlyConfig.upsert({
      where: { entityId_year: { entityId: greentech.id, year } },
      update: {},
      create: { entityId: greentech.id, year, baselineYear: year === 2023 },
    });
  }

  // ── Fetch activities ───────────────────────────────────────────────────────
  const activities = await prisma.activity.findMany({
    include: { emissionFactors: { where: { isDefault: true } } },
  });

  // Acme: 2021-2025 full year, 2026 Jan-Apr only (today = Apr 2026)
  const acmeTotal = await seedForEntity(
    acme.id, acmeUser.id, activities,
    ACME_CONFIG, ACME_YEAR_SCALE,
    { 2021: 12, 2022: 12, 2023: 12, 2024: 12, 2025: 12, 2026: 4 },
    "Acme Corp"
  );

  // GreenTech: 2023-2025 full year, 2026 Jan-Apr
  const gtTotal = await seedForEntity(
    greentech.id, greentechUser.id, activities,
    GREENTECH_CONFIG, GREENTECH_YEAR_SCALE,
    { 2023: 12, 2024: 12, 2025: 12, 2026: 4 },
    "GreenTech"
  );

  console.log(`
✅ Done
   Acme Corp       — ${acmeTotal} records (2021–2026)
   GreenTech       — ${gtTotal} records (2023–2026)
   Total           — ${acmeTotal + gtTotal} records

   Logins:
     admin@carbonly.io     / admin1234
     expert@acme-corp.com  / expert1234
     expert@greentech.io   / green1234
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
