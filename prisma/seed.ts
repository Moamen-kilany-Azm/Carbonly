import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── Scopes ──────────────────────────────────────────────────────────────────
  const scope1 = await prisma.scope.upsert({
    where: { number: 1 },
    update: {},
    create: {
      number: 1,
      name: "Direct Emissions",
      description: "Direct GHG emissions from owned or controlled sources",
      color: "#22c55e",
    },
  });

  const scope2 = await prisma.scope.upsert({
    where: { number: 2 },
    update: {},
    create: {
      number: 2,
      name: "Indirect Energy Emissions",
      description: "Indirect GHG emissions from the generation of purchased energy",
      color: "#3b82f6",
    },
  });

  const scope3 = await prisma.scope.upsert({
    where: { number: 3 },
    update: {},
    create: {
      number: 3,
      name: "Value Chain Emissions",
      description: "All other indirect emissions in a company's value chain",
      color: "#f59e0b",
    },
  });

  // ── Scope 1 Activities ───────────────────────────────────────────────────────
  const s1Activities = [
    {
      name: "Stationary Combustion — Natural Gas",
      unit: "kWh",
      equation: "CO2e = consumption (kWh) × EF (kgCO2e/kWh)",
      description: "Burning natural gas in boilers, heaters, and furnaces",
      sortOrder: 1,
      factors: [
        { name: "Natural Gas — UK DEFRA 2024", value: 0.18316, unit: "kgCO2e/kWh", source: "DEFRA", region: "UK", gwp: "AR5" },
        { name: "Natural Gas — EPA 2024", value: 0.18182, unit: "kgCO2e/kWh", source: "EPA", region: "US", gwp: "AR5" },
      ],
    },
    {
      name: "Stationary Combustion — Diesel",
      unit: "litres",
      equation: "CO2e = consumption (litres) × EF (kgCO2e/litre)",
      description: "Diesel used in generators and heating equipment",
      sortOrder: 2,
      factors: [
        { name: "Diesel — UK DEFRA 2024", value: 2.56392, unit: "kgCO2e/litre", source: "DEFRA", region: "UK", gwp: "AR5" },
        { name: "Diesel — EPA 2024", value: 2.68444, unit: "kgCO2e/litre", source: "EPA", region: "US", gwp: "AR5" },
      ],
    },
    {
      name: "Mobile Combustion — Company Vehicles (Petrol)",
      unit: "litres",
      equation: "CO2e = consumption (litres) × EF (kgCO2e/litre)",
      description: "Petrol/gasoline used in company-owned cars and vans",
      sortOrder: 3,
      factors: [
        { name: "Petrol — UK DEFRA 2024", value: 2.31397, unit: "kgCO2e/litre", source: "DEFRA", region: "UK", gwp: "AR5" },
      ],
    },
    {
      name: "Fugitive Emissions — Refrigerants (R-410A)",
      unit: "kg",
      equation: "CO2e = leaked refrigerant (kg) × GWP",
      description: "Refrigerant leakage from air conditioning and cooling systems",
      sortOrder: 4,
      factors: [
        { name: "R-410A Refrigerant — IPCC AR5", value: 2088, unit: "kgCO2e/kg", source: "IPCC", region: "GLOBAL", gwp: "AR5" },
      ],
    },
  ];

  // ── Scope 2 Activities ───────────────────────────────────────────────────────
  const s2Activities = [
    {
      name: "Purchased Electricity",
      unit: "kWh",
      equation: "CO2e = consumption (kWh) × grid EF (kgCO2e/kWh)",
      description: "Electricity purchased from the grid (location-based method)",
      sortOrder: 1,
      factors: [
        { name: "UK Grid — DEFRA 2024", value: 0.20493, unit: "kgCO2e/kWh", source: "DEFRA", region: "UK", gwp: "AR5" },
        { name: "US Average Grid — EPA 2024", value: 0.38600, unit: "kgCO2e/kWh", source: "EPA", region: "US", gwp: "AR5" },
        { name: "EU Average Grid — 2024", value: 0.27500, unit: "kgCO2e/kWh", source: "EEA", region: "EU", gwp: "AR5" },
      ],
    },
    {
      name: "Purchased Heat / Steam",
      unit: "kWh",
      equation: "CO2e = consumption (kWh) × district heat EF (kgCO2e/kWh)",
      description: "Heat or steam purchased from a district heating network",
      sortOrder: 2,
      factors: [
        { name: "District Heating — UK DEFRA 2024", value: 0.23000, unit: "kgCO2e/kWh", source: "DEFRA", region: "UK", gwp: "AR5" },
      ],
    },
  ];

  // ── Scope 3 Activities ───────────────────────────────────────────────────────
  const s3Activities = [
    {
      name: "Business Travel — Domestic Flight",
      unit: "passenger-km",
      equation: "CO2e = distance (pkm) × EF (kgCO2e/pkm)",
      description: "Flights within the same country for business purposes",
      sortOrder: 1,
      factors: [
        { name: "Domestic Flight (economy) — DEFRA 2024", value: 0.25500, unit: "kgCO2e/pkm", source: "DEFRA", region: "UK", gwp: "AR5" },
      ],
    },
    {
      name: "Business Travel — International Long-Haul Flight",
      unit: "passenger-km",
      equation: "CO2e = distance (pkm) × EF (kgCO2e/pkm)",
      description: "Long-haul international flights (>3700 km) for business",
      sortOrder: 2,
      factors: [
        { name: "Long-haul International (economy) — DEFRA 2024", value: 0.19500, unit: "kgCO2e/pkm", source: "DEFRA", region: "GLOBAL", gwp: "AR5" },
      ],
    },
    {
      name: "Employee Commuting — Car",
      unit: "passenger-km",
      equation: "CO2e = distance (pkm) × EF (kgCO2e/pkm)",
      description: "Employee travel to/from work by private car",
      sortOrder: 3,
      factors: [
        { name: "Average Car — UK DEFRA 2024", value: 0.17140, unit: "kgCO2e/pkm", source: "DEFRA", region: "UK", gwp: "AR5" },
      ],
    },
    {
      name: "Purchased Goods — Paper",
      unit: "tonnes",
      equation: "CO2e = quantity (tonnes) × EF (kgCO2e/tonne)",
      description: "Paper products procured for office use",
      sortOrder: 4,
      factors: [
        { name: "Paper — UK DEFRA 2024", value: 907.0, unit: "kgCO2e/tonne", source: "DEFRA", region: "UK", gwp: "AR5" },
      ],
    },
    {
      name: "Waste — Landfill (Mixed Waste)",
      unit: "tonnes",
      equation: "CO2e = waste (tonnes) × EF (kgCO2e/tonne)",
      description: "Office/operational waste disposed to landfill",
      sortOrder: 5,
      factors: [
        { name: "Mixed Waste to Landfill — DEFRA 2024", value: 467.0, unit: "kgCO2e/tonne", source: "DEFRA", region: "UK", gwp: "AR5" },
      ],
    },
  ];

  // Create activities & emission factors
  const createActivities = async (
    activities: typeof s1Activities,
    scopeId: string
  ) => {
    for (const a of activities) {
      const activity = await prisma.activity.create({
        data: {
          scopeId,
          name: a.name,
          unit: a.unit,
          equation: a.equation,
          description: a.description,
          sortOrder: a.sortOrder,
        },
      });
      for (const [i, f] of a.factors.entries()) {
        await prisma.emissionFactor.create({
          data: {
            activityId: activity.id,
            name: f.name,
            value: f.value,
            unit: f.unit,
            source: f.source,
            region: f.region,
            gwp: f.gwp,
            isDefault: i === 0,
          },
        });
      }
    }
  };

  await createActivities(s1Activities, scope1.id);
  await createActivities(s2Activities, scope2.id);
  await createActivities(s3Activities, scope3.id);

  // ── Demo entity ──────────────────────────────────────────────────────────────
  const entity = await prisma.entity.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      industry: "Manufacturing",
      country: "UK",
      subscriptionStatus: "ACTIVE",
    },
  });

  // ── Demo users ───────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin1234", 10);
  const expertHash = await bcrypt.hash("expert1234", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@carbonly.io" },
    update: {},
    create: {
      email: "admin@carbonly.io",
      name: "Platform Admin",
      passwordHash: adminHash,
      globalRole: "SUPER_ADMIN",
    },
  });

  const expertUser = await prisma.user.upsert({
    where: { email: "expert@acme-corp.com" },
    update: {},
    create: {
      email: "expert@acme-corp.com",
      name: "Carbon Expert",
      passwordHash: expertHash,
      globalRole: "EXPERT",
    },
  });

  await prisma.userEntity.upsert({
    where: { userId_entityId: { userId: expertUser.id, entityId: entity.id } },
    update: {},
    create: { userId: expertUser.id, entityId: entity.id, role: "EXPERT" },
  });

  await prisma.userEntity.upsert({
    where: { userId_entityId: { userId: adminUser.id, entityId: entity.id } },
    update: {},
    create: { userId: adminUser.id, entityId: entity.id, role: "ADMIN" },
  });

  // ── Yearly config ────────────────────────────────────────────────────────────
  await prisma.yearlyConfig.upsert({
    where: { entityId_year: { entityId: entity.id, year: 2024 } },
    update: {},
    create: { entityId: entity.id, year: 2024, baselineYear: true, notes: "GHG baseline year" },
  });

  console.log("Seed complete.");
  console.log("  Admin:  admin@carbonly.io / admin1234");
  console.log("  Expert: expert@acme-corp.com / expert1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
