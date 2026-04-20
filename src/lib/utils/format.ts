/**
 * Format CO2e values for display
 */
export function formatCO2e(tonnes: number): string {
  if (tonnes >= 1000) {
    return `${(tonnes / 1000).toLocaleString("en", { maximumFractionDigits: 1 })}k tCO2e`;
  }
  if (tonnes >= 1) {
    return `${tonnes.toLocaleString("en", { maximumFractionDigits: 2 })} tCO2e`;
  }
  return `${(tonnes * 1000).toLocaleString("en", { maximumFractionDigits: 1 })} kgCO2e`;
}

export function formatQuantity(value: number, unit: string): string {
  return `${value.toLocaleString("en", { maximumFractionDigits: 2 })} ${unit}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
