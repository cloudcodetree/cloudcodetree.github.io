import { isSearchTopic } from './search-telemetry.mjs';

// Public telemetry is a fixed vocabulary of topic counters. Legacy raw-query
// rows are rejected, including by the serializer (the last publication boundary).
const day = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : '';
function safe(row) {
  if (!row || Object.hasOwn(row, 'q') || !isSearchTopic(row.topic)) return null;
  if (!Number.isSafeInteger(row.count) || row.count < 1 || !day(row.first_seen)) return null;
  return { topic: row.topic, first_seen: row.first_seen, count: row.count };
}
export function parseMisses(text) {
  const rows = String(text ?? '').split('\n').flatMap((line) => {
    try { const row = safe(JSON.parse(line)); return row ? [row] : []; } catch { return []; }
  });
  return mergeMisses(rows, [], '');
}
export function mergeMisses(existing, incoming, today) {
  const map = new Map();
  for (const candidate of [
    ...(existing ?? []),
    ...(incoming ?? []).filter((s) => s && !Object.hasOwn(s, 'q')).map((s) => ({ topic: s.topic, first_seen: day(s.date) || day(today), count: 1 })),
  ]) {
    const row = safe(candidate);
    if (!row) continue;
    const old = map.get(row.topic);
    map.set(row.topic, old ? { topic: row.topic, first_seen: [old.first_seen, row.first_seen].sort()[0], count: old.count + row.count } : row);
  }
  return [...map.values()].sort((a, b) => a.topic.localeCompare(b.topic));
}
export function serializeMisses(rows) {
  const safeRows = mergeMisses(rows, [], '');
  return safeRows.length ? safeRows.map((r) => JSON.stringify(r)).join('\n') + '\n' : '';
}
