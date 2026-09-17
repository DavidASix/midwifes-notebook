/** Converts a pounds/ounces entry to the nearest whole gram. */
export function poundsOuncesToGrams(pounds: number, ounces: number): number {
  return Math.round((pounds * 16 + ounces) * 28.349523125);
}

/** Converts grams for display and carries a rounded 16.0 ounces into pounds. */
export function gramsToPoundsOunces(grams: number): {
  pounds: number;
  ounces: number;
} {
  const totalOunces = grams / 28.349523125;
  let pounds = Math.floor(totalOunces / 16);
  let ounces = Math.round((totalOunces - pounds * 16) * 10) / 10;
  if (ounces === 16) {
    pounds += 1;
    ounces = 0;
  }
  return { pounds, ounces };
}

/** Displays canonical grams alongside rounded pounds and ounces. */
export function formatWeight(grams: number): string {
  const { pounds, ounces } = gramsToPoundsOunces(grams);
  return `${grams} g · ${pounds} lb ${ounces.toFixed(1)} oz`;
}
