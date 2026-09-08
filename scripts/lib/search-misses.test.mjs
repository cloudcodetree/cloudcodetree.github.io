import { describe, expect, it } from 'vitest';
import { mergeMisses, parseMisses, serializeMisses } from './search-misses.mjs';
import { dayOf, harvestWindow, newestEventMs, sightingFrom } from '../harvest-search-misses.mjs';

const rows = [
  { q: 'langgraph checkpointing', first_seen: '2026-09-01', count: 3 },
  { q: 'mcp auth', first_seen: '2026-09-02', count: 1 },
];

describe('parseMisses', () => {
  it('reads one object per line and ignores blank lines', () => {
    expect(parseMisses('{"q":"a","first_seen":"2026-09-01","count":3}\n\n{"q":"b","first_seen":"2026-09-02","count":1}\n')).toEqual([
      { q: 'a', first_seen: '2026-09-01', count: 3 },
      { q: 'b', first_seen: '2026-09-02', count: 1 },
    ]);
  });

  it('skips a malformed line rather than throwing', () => {
    const text = '{"q":"a","first_seen":"2026-09-01","count":1}\nnot json at all\n{"first_seen":"2026-09-02"}\n{"q":"b","first_seen":"2026-09-02","count":2}\n';
    expect(parseMisses(text).map((r) => r.q)).toEqual(['a', 'b']);
  });

  it('is empty for empty input', () => {
    expect(parseMisses('')).toEqual([]);
  });

  it('reads the optional top score', () => {
    expect(parseMisses('{"q":"a","first_seen":"2026-09-01","count":2,"top":0.657}\n')).toEqual([
      { q: 'a', first_seen: '2026-09-01', count: 2, top: 0.657 },
    ]);
  });

  it('merges a query that appears on two lines into one row', () => {
    const text = '{"q":"a","first_seen":"2026-09-02","count":2}\n{"q":"b","first_seen":"2026-09-03","count":1}\n{"q":"a","first_seen":"2026-09-01","count":3,"top":0.6}\n';
    expect(parseMisses(text)).toEqual([
      { q: 'a', first_seen: '2026-09-01', count: 5, top: 0.6 },
      { q: 'b', first_seen: '2026-09-03', count: 1 },
    ]);
  });
});

describe('mergeMisses', () => {
  it('appends a query it has never seen with count 1 and its own date', () => {
    const out = mergeMisses(rows, [{ q: 'vectorize metadata', date: '2026-09-08' }], '2026-09-08');
    expect(out).toHaveLength(3);
    expect(out[2]).toEqual({ q: 'vectorize metadata', first_seen: '2026-09-08', count: 1 });
  });

  it('increments an existing query by the number of sightings and leaves first_seen alone', () => {
    const out = mergeMisses(rows, [
      { q: 'mcp auth', date: '2026-09-08' },
      { q: 'mcp auth', date: '2026-09-08' },
    ], '2026-09-08');
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual({ q: 'mcp auth', first_seen: '2026-09-02', count: 3 });
  });

  it('counts every sighting of a brand-new query and dates it from the earliest', () => {
    const out = mergeMisses([], [
      { q: 'ollama tool calling', date: '2026-09-08' },
      { q: 'ollama tool calling', date: '2026-09-07' },
      { q: 'ollama tool calling', date: '2026-09-08' },
    ], '2026-09-08');
    expect(out).toEqual([{ q: 'ollama tool calling', first_seen: '2026-09-07', count: 3 }]);
  });

  it('keeps existing entries in their positions and appends new ones in first-seen order', () => {
    const out = mergeMisses(rows, [
      { q: 'zed editor', date: '2026-09-08' },
      { q: 'mcp auth', date: '2026-09-08' },
      { q: 'agentic evals', date: '2026-09-07' },
    ], '2026-09-08');
    expect(out.map((r) => r.q)).toEqual(['langgraph checkpointing', 'mcp auth', 'agentic evals', 'zed editor']);
    expect(out[0]).toEqual(rows[0]);
  });

  it('does not mutate the arrays it is given', () => {
    const existing = [{ q: 'a', first_seen: '2026-09-01', count: 1 }];
    mergeMisses(existing, [{ q: 'a', date: '2026-09-08' }, { q: 'b', date: '2026-09-08' }], '2026-09-08');
    expect(existing).toEqual([{ q: 'a', first_seen: '2026-09-01', count: 1 }]);
  });

  it('falls back to today for a sighting with no usable date', () => {
    expect(mergeMisses([], [{ q: 'a' }], '2026-09-08')).toEqual([{ q: 'a', first_seen: '2026-09-08', count: 1 }]);
  });

  it('is a no-op when nothing came in', () => {
    expect(mergeMisses(rows, [], '2026-09-08')).toEqual(rows);
  });

  it('records the top score on a first sighting and leaves it alone on repeats', () => {
    const first = mergeMisses([], [{ q: 'vectorize hnsw', date: '2026-09-08', top: 0.657 }], '2026-09-08');
    expect(first).toEqual([{ q: 'vectorize hnsw', first_seen: '2026-09-08', count: 1, top: 0.657 }]);
    const again = mergeMisses(first, [{ q: 'vectorize hnsw', date: '2026-09-09', top: 0.42 }], '2026-09-09');
    expect(again).toEqual([{ q: 'vectorize hnsw', first_seen: '2026-09-08', count: 2, top: 0.657 }]);
  });
});

// CI runs on every push (the routine pushes 3x/day), not daily, so a fixed
// window would re-harvest the same events several times and inflate `count` —
// the field the dashboard and the routine rank by. The cursor is what stops it.
describe('harvestWindow', () => {
  const now = 1788901599409; // 2026-09-08T21:06:39Z
  const day = 86_400_000;

  it('falls back to the --days window with no state', () => {
    expect(harvestWindow({ lastEventMs: null, days: 2, now })).toEqual({ from: now - 2 * day, to: now });
    expect(harvestWindow({ lastEventMs: NaN, days: 2, now })).toEqual({ from: now - 2 * day, to: now });
  });

  it('resumes just after the newest event already harvested', () => {
    const last = now - 3600_000;
    expect(harvestWindow({ lastEventMs: last, days: 2, now })).toEqual({ from: last + 1, to: now });
  });

  it('never reaches back further than the --days window (the API caps at 7 days)', () => {
    expect(harvestWindow({ lastEventMs: now - 30 * day, days: 2, now })).toEqual({ from: now - 2 * day, to: now });
  });

  it('harvesting the same window twice does not change counts', () => {
    const events = [
      { q: 'terraform state locking', date: '2026-09-08', ts: now - 20_000 },
      { q: 'terraform state locking', date: '2026-09-08', ts: now - 10_000 },
      { q: 'vim keybindings', date: '2026-09-08', ts: now - 5_000 },
    ];
    // Run 1: no state, whole window.
    const w1 = harvestWindow({ lastEventMs: null, days: 2, now });
    const seen1 = events.filter((e) => e.ts >= w1.from && e.ts <= w1.to);
    const after1 = mergeMisses([], seen1, '2026-09-08');
    expect(after1.map((r) => r.count)).toEqual([2, 1]);

    // Run 2, minutes later: same events still inside the --days window, but the
    // cursor from run 1 excludes every one of them.
    const w2 = harvestWindow({ lastEventMs: newestEventMs(seen1), days: 2, now: now + 60_000 });
    const seen2 = events.filter((e) => e.ts >= w2.from && e.ts <= w2.to);
    expect(seen2).toEqual([]);
    expect(mergeMisses(after1, seen2, '2026-09-08')).toEqual(after1);
  });
});

describe('newestEventMs', () => {
  it('is the largest timestamp, or null when there is nothing to remember', () => {
    expect(newestEventMs([{ ts: 5 }, { ts: 9 }, { ts: 7 }])).toBe(9);
    expect(newestEventMs([])).toBeNull();
    expect(newestEventMs([{ ts: undefined }])).toBeNull();
  });
});

describe('serializeMisses', () => {
  it('writes one compact object per line with a trailing newline', () => {
    expect(serializeMisses(rows)).toBe(
      '{"q":"langgraph checkpointing","first_seen":"2026-09-01","count":3}\n{"q":"mcp auth","first_seen":"2026-09-02","count":1}\n',
    );
    expect(serializeMisses([])).toBe('');
  });

  it('keeps the top score when a row has one', () => {
    expect(serializeMisses([{ q: 'a', first_seen: '2026-09-01', count: 1, top: 0.657 }]))
      .toBe('{"q":"a","first_seen":"2026-09-01","count":1,"top":0.657}\n');
  });

  it('round-trips through parseMisses', () => {
    const merged = mergeMisses(rows, [{ q: 'quoted "thing"', date: '2026-09-08' }, { q: 'mcp auth', date: '2026-09-08' }], '2026-09-08');
    expect(parseMisses(serializeMisses(merged))).toEqual(merged);
  });
});

// The envelopes below are trimmed copies of real events returned by the
// Workers observability API on 2026-09-08: the platform PARSES a console.log
// of a JSON string, so `source` is the object itself and $metadata carries no
// `message` for these (`type: cf-worker`). Request rows (`cf-worker-event`)
// are the ones with a string message, and must never count as a miss.
describe('sightingFrom', () => {
  const miss = {
    source: { event: 'search_miss', q: 'langgraph checkpointing' },
    timestamp: 1788901599409,
    $metadata: { service: 'cct-site', type: 'cf-worker', trigger: 'GET /api/search' },
  };

  it('reads q, the UTC day, the timestamp and the top score off a parsed miss event', () => {
    expect(sightingFrom({ ...miss, source: { ...miss.source, top: 0.657 } })).toEqual({
      q: 'langgraph checkpointing', date: '2026-09-08', ts: 1788901599409, top: 0.657,
    });
  });

  it('tolerates a miss logged without a top score (a cache hit has none)', () => {
    expect(sightingFrom(miss)).toEqual({ q: 'langgraph checkpointing', date: '2026-09-08', ts: 1788901599409, top: undefined });
  });

  it('also reads a miss the platform left as a raw string', () => {
    expect(sightingFrom({ source: { message: '{"event":"search_miss","q":"mcp auth","top":0.5}' }, timestamp: 1788901599409 }))
      .toEqual({ q: 'mcp auth', date: '2026-09-08', ts: 1788901599409, top: 0.5 });
  });

  it('ignores successful searches, request rows, unparseable messages and empty queries', () => {
    expect(sightingFrom({ source: { event: 'search', results: 20, ms: 1243 }, timestamp: 1788901599409 })).toBeNull();
    expect(sightingFrom({ source: { level: 'info', message: 'GET https://cloudcodetree.com/api/search?q=x' }, timestamp: 1 })).toBeNull();
    expect(sightingFrom({ source: { event: 'search_miss' }, timestamp: 1 })).toBeNull();
    expect(sightingFrom({ source: { event: 'search_miss', q: '' }, timestamp: 1 })).toBeNull();
    expect(sightingFrom({})).toBeNull();
    expect(sightingFrom(null)).toBeNull();
  });
});

describe('dayOf', () => {
  it('is the UTC day', () => {
    expect(dayOf(1788901599409)).toBe('2026-09-08');
  });
});
