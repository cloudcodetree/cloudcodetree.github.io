#!/usr/bin/env node
/**
 * harvest-search-misses.mjs — pull zero-result searches out of Workers
 * observability and append them to content/search-misses.jsonl.
 *
 *   node scripts/harvest-search-misses.mjs             merge new events into the file
 *   node scripts/harvest-search-misses.mjs --days 7    widen the fallback window (API caps at 7)
 *   node scripts/harvest-search-misses.mjs --dry-run   print what it would add, write nothing
 *
 * worker/search.ts logs `{"event":"search_miss","q":"…","top":0.657}` when a
 * DELIBERATE search collapses to nothing above the relevance floor. Cloudflare
 * keeps those logs for about a week; this script is what makes them durable, so
 * the publishing routine can see what readers looked for and could not find
 * (docs/superpowers/specs/2026-09-08-search-analytics-design.md).
 *
 * **The cursor matters.** CI runs on every push to main and the publishing
 * routine pushes ~3x/day, so a fixed `--days` window would re-harvest the same
 * events several times and inflate `count` — the field the dashboard and the
 * routine rank by. content/search-misses.state.json remembers the newest event
 * already harvested and the next run resumes just after it; the `--days` window
 * is only the floor for a first run or lost state.
 *
 * Response shape, verified against the live account on 2026-09-08: a
 * console.log of a JSON string is PARSED by the platform, so the event's
 * `source` is the object itself ({event, q, top}) and `$metadata.message` is
 * absent — that field only carries the request line ("GET https://…/api/search?q=…")
 * of `type: cf-worker-event` rows. Hence the filter below is on the parsed
 * `event` field, not on `$metadata.message`; a message filter matches zero
 * console logs. The parser still accepts a raw `source.message` string in case
 * the platform ever stops parsing.
 *
 * Telemetry must never block a deploy: every failure path (no token, HTTP
 * error, unexpected shape) prints a `!` warning and exits 0. The one thing it
 * will NOT do is write a truncated file — an unreadable existing file aborts
 * the run rather than replacing history with the current window.
 */
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API, cfCredentials } from './lib/r2.mjs';
import { mergeMisses, parseMisses, serializeMisses } from './lib/search-misses.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MISSES_FILE = path.join(ROOT, 'content', 'search-misses.jsonl');
const STATE_FILE = path.join(ROOT, 'content', 'search-misses.state.json');
const DEFAULT_DAYS = 2;
const MAX_DAYS = 7; // the observability API's own limit
const LIMIT = 1000;
const DAY_MS = 86_400_000;

export function parseArgs(argv) {
  const inline = argv.find((a) => a.startsWith('--days='));
  const at = argv.indexOf('--days');
  const raw = inline ? inline.slice('--days='.length) : at === -1 ? null : argv[at + 1];
  let days = DEFAULT_DAYS;
  let clamped = false;
  if (raw !== null && raw !== undefined) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      console.warn(`! --days "${raw}" is not a positive number — using ${DEFAULT_DAYS}`);
    } else if (n > MAX_DAYS) {
      days = MAX_DAYS;
      clamped = true;
    } else {
      days = n;
    }
  }
  return { dryRun: argv.includes('--dry-run'), days, clamped };
}

/** Epoch ms → YYYY-MM-DD (UTC, the timeframe's own clock). */
export function dayOf(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The window to ask for: just after the newest event already harvested, but
 * never further back than the `--days` floor (the API refuses more than 7 days
 * anyway, and a stale cursor must not widen the request).
 */
export function harvestWindow({ lastEventMs, days, now }) {
  const floor = now - days * DAY_MS;
  const from = Number.isFinite(lastEventMs) && lastEventMs !== null ? Math.max(lastEventMs + 1, floor) : floor;
  return { from, to: now };
}

/** The cursor to remember, or null when this run saw nothing worth remembering. */
export function newestEventMs(sightings) {
  let newest = null;
  for (const s of sightings ?? []) {
    if (Number.isFinite(s.ts) && (newest === null || s.ts > newest)) newest = s.ts;
  }
  return newest;
}

/**
 * One observability event → { q, date, ts, top }, or null when it isn't a
 * usable miss. `source` is the parsed log object; the `message` branch is the
 * fallback for a log the platform left as a string.
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
  const top = Number(payload.top);
  return {
    q: payload.q,
    date: Number.isFinite(ts) ? dayOf(ts) : undefined,
    ts: Number.isFinite(ts) ? ts : undefined,
    top: Number.isFinite(top) ? top : undefined,
  };
}

/** Read a file, or '' when it genuinely does not exist. Any other error throws. */
async function readIfPresent(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (e) {
    if (e && e.code === 'ENOENT') return '';
    // EACCES, EISDIR, EIO: treating these as "empty" would rewrite the file
    // with only the current window and destroy the history.
    throw new Error(`cannot read ${path.relative(ROOT, file)}: ${e.message}`);
  }
}

/** Atomic: the workflow cancels in-progress runs, so a half-written file is a real risk. */
async function writeAtomic(file, contents) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, contents);
  await rename(tmp, file);
}

async function readCursor() {
  const text = await readIfPresent(STATE_FILE);
  if (!text.trim()) return null;
  try {
    const state = JSON.parse(text);
    const last = Number(state && state.last_event_ms);
    return Number.isFinite(last) && last > 0 ? last : null;
  } catch {
    console.warn('! search-misses.state.json is not valid JSON — falling back to the --days window');
    return null;
  }
}

async function fetchMisses({ from, to }) {
  const { token, accountId } = cfCredentials();
  if (!token) {
    console.warn('! CLOUDFLARE_API_TOKEN not set — skipping the search-miss harvest');
    return null;
  }
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
    timeframe: { from, to },
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
  if (events.length === LIMIT) {
    console.warn(`! observability returned the maximum ${LIMIT} events — results may be truncated; run again to catch the rest`);
  }
  return events.map(sightingFrom).filter(Boolean);
}

async function main() {
  const { dryRun, days, clamped } = parseArgs(process.argv.slice(2));
  let sightings;
  let window;
  try {
    const cursor = await readCursor();
    window = harvestWindow({ lastEventMs: cursor, days, now: Date.now() });
    console.log(
      `  window ${new Date(window.from).toISOString()} → ${new Date(window.to).toISOString()}` +
        ` (${cursor ? 'resuming after the last harvested event' : `${days}-day fallback`}${clamped ? `, --days clamped to ${MAX_DAYS}` : ''})`,
    );
    sightings = await fetchMisses(window);
  } catch (e) {
    console.warn(`! search-miss harvest failed: ${e.message}`);
    return;
  }
  if (!sightings) return;

  let before;
  try {
    before = await readIfPresent(MISSES_FILE);
  } catch (e) {
    console.warn(`! ${e.message} — refusing to write, so nothing is lost`);
    return;
  }
  const existing = parseMisses(before);
  const known = new Map(existing.map((r) => [r.q, r.count]));
  const merged = mergeMisses(existing, sightings, dayOf(Date.now()));
  const added = merged.filter((r) => !known.has(r.q));
  const bumped = merged.filter((r) => known.has(r.q) && r.count !== known.get(r.q));
  const after = serializeMisses(merged);

  for (const r of added) console.log(`  + ${r.q} (${r.count})`);
  for (const r of bumped) console.log(`  ~ ${r.q} (${known.get(r.q)} → ${r.count})`);

  if (dryRun) {
    console.log(`✓ search misses — ${added.length} new, ${bumped.length} incremented, ${merged.length} total (dry run — nothing written)`);
    return;
  }
  // Nothing to say: leave the file (and the CI commit step) untouched rather
  // than creating an empty one.
  if (after !== before) await writeAtomic(MISSES_FILE, after);
  const cursor = newestEventMs(sightings);
  if (cursor !== null) await writeAtomic(STATE_FILE, `${JSON.stringify({ last_event_ms: cursor }, null, 2)}\n`);
  console.log(`✓ search misses — ${added.length} new, ${bumped.length} incremented, ${merged.length} total`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Never a non-zero exit: this runs inside the deploy workflow.
  main().catch((e) => { console.warn(`! search-miss harvest failed: ${e.message}`); });
}
