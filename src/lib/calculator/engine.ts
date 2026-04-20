/**
 * Core emissions calculation engine.
 * Pure functions — no I/O, no side effects. All inputs come pre-fetched.
 *
 * GHG Protocol formula (applies to all scopes):
 *   CO2e = Activity Data × Emission Factor (kgCO2e / unit)
 */

export interface CalculationInput {
  quantity: number;
  emissionFactorValue: number; // kgCO2e per unit
}

export interface CalculationResult {
  co2eKg: number;
  co2eT: number;
}

export function calculate(input: CalculationInput): CalculationResult {
  const co2eKg = input.quantity * input.emissionFactorValue;
  return {
    co2eKg: Math.round(co2eKg * 1000) / 1000,
    co2eT: Math.round((co2eKg / 1000) * 1000000) / 1000000,
  };
}

/**
 * Scope 1 — Direct emissions from owned/controlled sources
 * e.g. stationary combustion, mobile combustion, fugitive emissions
 */
export function calculateScope1(input: CalculationInput): CalculationResult {
  return calculate(input);
}

/**
 * Scope 2 — Indirect emissions from purchased energy
 * Supports both location-based and market-based methods
 */
export function calculateScope2(input: CalculationInput): CalculationResult {
  return calculate(input);
}

/**
 * Scope 3 — All other indirect emissions in the value chain
 * 15 categories per GHG Protocol Corporate Value Chain Standard
 */
export function calculateScope3(input: CalculationInput): CalculationResult {
  return calculate(input);
}

/**
 * Aggregate totals across multiple records
 */
export function aggregateTotals(records: CalculationResult[]): {
  totalCo2eKg: number;
  totalCo2eT: number;
} {
  const totalCo2eKg = records.reduce((sum, r) => sum + r.co2eKg, 0);
  return {
    totalCo2eKg: Math.round(totalCo2eKg * 1000) / 1000,
    totalCo2eT: Math.round((totalCo2eKg / 1000) * 1000000) / 1000000,
  };
}
