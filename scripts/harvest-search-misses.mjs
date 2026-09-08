#!/usr/bin/env node
/**
 * harvest-search-misses.mjs — pull zero-result searches out of Workers
 * observability and append them to content/search-misses.jsonl.
 *
 *   node scripts/harvest-search-misses.mjs             merge the last 2 days into the file
 *   node scripts/harvest-search-misses.mjs --days 7    widen the window (the API caps at 7)
 *   node scripts/harvest-search-misses.mjs --dry-run   print what it would add, write nothing
 *
 * worker/search.ts logs `{"event":"search_miss","q":"…"}` when a search
 * collapses to nothing. Cloudflare keeps those logs for about a week; this
 * script is what makes them durable, so the publishing routine can see what
 * readers looked for and could not find
 * (docs/superpowers/specs/2026-09-08-search-analytics-design.md).
 *
 * Response shape, verified against the live account on 2026-09-08: a
 * console.log of a JSON string is PARSED by the platform, so the event's
 * `source` is the object itself ({event, q}) and `$metadata.message` is absent
 * — that field only carries the request line ("GET https://…/api/search?q=…")
 * of `type: cf-worker-event` rows. Hence the filter below is on the parsed
 * `event` field, not on `$metadata.message`; a message filter matches zero
 * console logs. The parser still accepts a raw `source.message` string in case
 * the platform ever stops parsing.
 *
 * Telemetry must never block a deploy: every failure path (no token, HTTP
 * error, unexpected shape) prints a `!` warning and exits 0.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API, cfCredentials } from './lib/r2.mjs';
import { mergeMisses, parseMisses, serializeMisses } from './lib/search-misses.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MISSES_FILE = path.join(ROOT, 'content', 'search-misses.jsonl');
const DEFAULT_DAYS = 2;
const LIMIT = 1000;

function parseArgs(argv) {
  const at = argv.indexOf('--days');
  const days = at === -1 ? DEFAULT_DAYS : Number(argv[at + 1]);
  return {
    dryRun: argv.includes('--dry-run'),
    days: Number.isFinite(days) && days > 0 ? Math.min(days, 7) : DEFAULT_DAYS,
  };
}

/** Epoch ms → YYYY-MM-DD (UTC, the timeframe's own clock). */
export function dayOf(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * One observability event → { q, date }, or null when it isn't a usable miss.
 * `source` is the parsed log object; the `message` branch is the fallback for
 * a log the platform left as a string.
 */
export function sightingFrom(event) {
  const source = event && event.source;
  if (!source || typeof source !== 'object') return null;
  let payload = source;
  if (typeof source.message === 'string') {
    try {
      payload = JSON.parse(source.message);
    } catch {
      return null;
    }
  }
  if (!payload || payload.event !== 'search_miss' || typeof payload.q !== 'string' || !payload.q) return null;
  const ts = Number(event.timestamp);
  return { q: payload.q, date: Number.isFinite(ts) ? dayOf(ts) : undefined };
}

async function fetchMisses({ days }) {
  const { token, accountId } = cfCredentials();
  if (!token) {
    console.warn('! CLOUDFLARE_API_TOKEN not set — skipping the search-miss harvest');
    return null;
  }
  const now = Date.now();
  const body = {
    queryId: 'search-misses-harvest',
    view: 'events',
    limit: LIMIT,
    dry: false,
    parameters: {
      datasets: ['cloudflare-workers'],
      filters: [
        { key: '$metadata.service', operation: 'eq', type: 'string', value: 'cct-site' },
        { key: 'event', operation: 'eq', type: 'string', value: 'search_miss' },
      ],
    },
    timeframe: { from: now - days * 86_400_000, to: now },
  };
  const res = await fetch(`${API}/accounts/${accountId}/workers/observability/telemetry/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    console.warn(`! observability query failed: HTTP ${res.status}`);
    return null;
  }
  const json = await res.json();
  const events = json && json.result && json.result.events && json.result.events.events;
  if (!Array.isArray(events)) {
    console.warn('! observability response had no events array — skipping');
    return null;
  }
  return events.map(sightingFrom).filter(Boolean);
}

async function main() {
  const { dryRun, days } = parseArgs(process.argv.slice(2));
  let sightings;
  try {
    sightings = await fetchMisses({ days });
  } catch (e) {
    console.warn(`! search-miss harvest failed: ${e.message}`);
    return;
  }
  if (!sightings) return;

  const before = await readFile(MISSES_FILE, 'utf8').catch(() => '');
  const existing = parseMisses(before);
  const known = new Set(existing.map((r) => r.q));
  const merged = mergeMisses(existing, sightings, dayOf(Date.now()));
  const added = merged.filter((r) => !known.has(r.q));
  const after = serializeMisses(merged);

  if (dryRun) {
    for (const r of added) console.log(`  + ${r.q} (${r.count})`);
    console.log(`✓ search misses — ${added.length} new, ${merged.length} total (dry run — nothing written)`);
    return;
  }
  // Nothing to say: leave the file (and the CI commit step) untouched rather
  // than creating an empty one.
  if (after !== before) {
    await mkdir(path.dirname(MISSES_FILE), { recursive: true });
    await writeFile(MISSES_FILE, after);
  }
  console.log(`✓ search misses — ${added.length} new, ${merged.length} total`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Never a non-zero exit: this runs inside the deploy workflow.
  main().catch((e) => { console.warn(`! search-miss harvest failed: ${e.message}`); });
}
