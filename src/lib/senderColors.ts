// Distinct, readable-on-dark palette cycled by sender index. Order is stable
// as long as the sender list order is stable (coreStats.perSender).
const PALETTE = [
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#22c55e', // green
  '#ef4444', // red
  '#3b82f6', // blue
  '#eab308', // yellow
  '#14b8a6', // teal
  '#a855f7', // purple
];

export function buildSenderColorMap(senders: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  senders.forEach((sender, i) => {
    map[sender] = PALETTE[i % PALETTE.length];
  });
  return map;
}
