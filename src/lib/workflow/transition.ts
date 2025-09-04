export type Edge = readonly [from: string, to: string];
export function canTransition(from: string, to: string, edges: readonly Edge[]): boolean {
  for (const [a, b] of edges) if (a === from && b === to) return true;
  return false;
}
