import { describe, expect, it } from 'vitest';
import { mergeMisses, parseMisses, serializeMisses } from './search-misses.mjs';
import { dayOf, sightingFrom } from '../harvest-search-misses.mjs';

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
});

describe('serializeMisses', () => {
  it('writes one compact object per line with a trailing newline', () => {
    expect(serializeMisses(rows)).toBe(
      '{"q":"langgraph checkpointing","first_seen":"2026-09-01","count":3}\n{"q":"mcp auth","first_seen":"2026-09-02","count":1}\n',
    );
    expect(serializeMisses([])).toBe('');
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

  it('reads q and the UTC day off a parsed miss event', () => {
    expect(sightingFrom(miss)).toEqual({ q: 'langgraph checkpointing', date: '2026-09-08' });
  });

  it('also reads a miss the platform left as a raw string', () => {
    expect(sightingFrom({ source: { message: '{"event":"search_miss","q":"mcp auth"}' }, timestamp: 1788901599409 }))
      .toEqual({ q: 'mcp auth', date: '2026-09-08' });
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
