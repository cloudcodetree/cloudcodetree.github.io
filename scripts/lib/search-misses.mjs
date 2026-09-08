/**
 * search-misses.mjs — the pure half of the zero-result search log.
 *
 * `content/search-misses.jsonl` is a committed, human-greppable file with one
 * object per line: {"q":"…","first_seen":"YYYY-MM-DD","count":N}. Only queries
 * that returned nothing are ever written down (see
 * docs/superpowers/specs/2026-09-08-search-analytics-design.md). Everything
 * here is I/O-free so the merge rules can be tested directly;
 * scripts/harvest-search-misses.mjs does the network and the file.
 */

/** Read JSONL into rows, skipping any line that isn't a usable miss. */
export function parseMisses(text) {
  const out = [];
  for (const line of String(text ?? '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let row;
    try {
      row = JSON.parse(trimmed);
    } catch {
      continue; // A half-written or hand-edited line must not break the harvest.
    }
    if (!row || typeof row !== 'object' || typeof row.q !== 'string' || !row.q) continue;
    const count = Number(row.count);
    out.push({
      q: row.q,
      first_seen: typeof row.first_seen === 'string' ? row.first_seen : '',
      count: Number.isFinite(count) && count > 0 ? count : 1,
    });
  }
  return out;
}

/**
 * Fold new sightings into the existing rows.
 *
 * `incoming` is [{ q, date }] — one entry per sighting, dates as YYYY-MM-DD.
 * A known `q` keeps its `first_seen` and its position, and gains one count per
 * sighting; an unknown `q` is appended with count 1 and the date of its
 * earliest sighting (`today` when a sighting carries no usable date).
 * Sightings are ordered by date first, so "appended in first-seen order" holds
 * however the API returned them. Neither argument is mutated.
 */
export function mergeMisses(existing, incoming, today) {
  const out = (existing ?? []).map((r) => ({ q: r.q, first_seen: r.first_seen, count: r.count }));
  const byQuery = new Map(out.map((r, i) => [r.q, i]));
  const sightings = (incoming ?? [])
    .filter((s) => s && typeof s.q === 'string' && s.q)
    .map((s) => ({ q: s.q, date: /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : today }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  for (const s of sightings) {
    const at = byQuery.get(s.q);
    if (at === undefined) {
      byQuery.set(s.q, out.length);
      out.push({ q: s.q, first_seen: s.date, count: 1 });
    } else {
      out[at].count += 1;
    }
  }
  return out;
}

/** Rows back to JSONL: one compact object per line, trailing newline. */
export function serializeMisses(rows) {
  if (!rows || rows.length === 0) return '';
  return rows.map((r) => JSON.stringify({ q: r.q, first_seen: r.first_seen, count: r.count })).join('\n') + '\n';
}
