/**
 * search-misses.mjs — the pure half of the zero-result search log.
 *
 * `content/search-misses.jsonl` is a committed, human-greppable file with one
 * object per line: {"q":"…","first_seen":"YYYY-MM-DD","count":N,"top":0.657}.
 * Only DELIBERATE searches that returned nothing are ever written down, and the
 * Worker scrubs anything that looks personal first — the file is committed to a
 * public repo (see docs/superpowers/specs/2026-09-08-search-analytics-design.md).
 * `top` is the best pre-floor similarity score, so the relevance floor stays
 * re-derivable from real traffic; it is absent for a miss served from cache.
 *
 * Everything here is I/O-free so the merge rules can be tested directly;
 * scripts/harvest-search-misses.mjs does the network and the file.
 */

function row(q, first_seen, count, top) {
  const out = { q, first_seen, count };
  if (Number.isFinite(top)) out.top = top;
  return out;
}

/**
 * Read JSONL into rows, skipping any line that isn't a usable miss. A query
 * that somehow appears on two lines is folded into one row (earliest
 * `first_seen`, counts summed, first `top` kept) so nothing downstream has to
 * cope with duplicates.
 */
export function parseMisses(text) {
  const out = [];
  const at = new Map();
  for (const line of String(text ?? '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue; // A half-written or hand-edited line must not break the harvest.
    }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.q !== 'string' || !parsed.q) continue;
    const count = Number(parsed.count);
    const first_seen = typeof parsed.first_seen === 'string' ? parsed.first_seen : '';
    const top = Number(parsed.top);
    const known = at.get(parsed.q);
    if (known === undefined) {
      at.set(parsed.q, out.length);
      out.push(row(parsed.q, first_seen, Number.isFinite(count) && count > 0 ? count : 1, top));
    } else {
      const existing = out[known];
      existing.count += Number.isFinite(count) && count > 0 ? count : 1;
      if (first_seen && (!existing.first_seen || first_seen < existing.first_seen)) existing.first_seen = first_seen;
      if (existing.top === undefined && Number.isFinite(top)) existing.top = top;
    }
  }
  return out;
}

/**
 * Fold new sightings into the existing rows.
 *
 * `incoming` is [{ q, date, top }] — one entry per sighting, dates as
 * YYYY-MM-DD. A known `q` keeps its `first_seen`, its `top` and its position,
 * and gains one count per sighting; an unknown `q` is appended with count 1,
 * the date of its earliest sighting (`today` when a sighting carries no usable
 * date) and that sighting's `top`. Sightings are ordered by date first, so "new
 * entries append in first-seen order" holds however the API returned them.
 * Neither argument is mutated.
 */
export function mergeMisses(existing, incoming, today) {
  const out = (existing ?? []).map((r) => row(r.q, r.first_seen, r.count, r.top));
  const byQuery = new Map(out.map((r, i) => [r.q, i]));
  const sightings = (incoming ?? [])
    .filter((s) => s && typeof s.q === 'string' && s.q)
    .map((s) => ({ q: s.q, date: /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : today, top: Number(s.top) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  for (const s of sightings) {
    const at = byQuery.get(s.q);
    if (at === undefined) {
      byQuery.set(s.q, out.length);
      out.push(row(s.q, s.date, 1, s.top));
    } else {
      out[at].count += 1;
    }
  }
  return out;
}

/** Rows back to JSONL: one compact object per line, trailing newline. */
export function serializeMisses(rows) {
  if (!rows || rows.length === 0) return '';
  return rows.map((r) => JSON.stringify(row(r.q, r.first_seen, r.count, r.top))).join('\n') + '\n';
}
