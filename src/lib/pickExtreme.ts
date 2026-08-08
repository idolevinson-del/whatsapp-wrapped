/** Picks the entry with the highest/lowest value — used to find "the winner"
 * in a per-sender breakdown (top sender, ghost, slowest replier, ...).
 * Shared by StatsPage (live analysis) and SharedStatsPage (received link),
 * which both already normalize their data into this {sender, value} shape. */
export function pickMax<T extends { value: number }>(entries: T[]): T | undefined {
  return entries.length ? entries.reduce((best, curr) => (curr.value > best.value ? curr : best)) : undefined;
}

export function pickMin<T extends { value: number }>(entries: T[]): T | undefined {
  return entries.length ? entries.reduce((best, curr) => (curr.value < best.value ? curr : best)) : undefined;
}
