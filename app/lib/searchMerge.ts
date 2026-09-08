/** Reciprocal rank fusion: score(id) = Σ 1 / (k + rank_in_list). Pure. */
export const RRF_K = 60;

export function rrfMerge(lists: string[][], k = RRF_K): string[] {
  const score = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, i) => score.set(id, (score.get(id) ?? 0) + 1 / (k + i + 1)));
  }
  return Array.from(score.entries()).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
