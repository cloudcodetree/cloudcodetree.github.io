import { describe, expect, it } from 'vitest';
import { mergeMisses, parseMisses, serializeMisses } from './search-misses.mjs';
import { topicForQuery } from './search-telemetry.mjs';
import { dayOf, harvestWindow, newestEventMs, sightingFrom } from '../harvest-search-misses.mjs';

const row = { topic: 'rag', first_seen: '2026-09-01', count: 3 };
describe('public search telemetry', () => {
  it('only emits fixed labels, including for names, phones, and credentials', () => {
    for (const text of ['Jane Example', '202-555-0142', 'me@example.com', 'sk-fake-credential', 'rag private company plans']) {
      expect(topicForQuery(text)).toBe('other');
    }
    expect(topicForQuery(' Claude   Code ')).toBe('claude-code');
  });
  it('rejects raw-query rows at both reading and publishing boundaries', () => {
    const unsafe = { ...row, q: 'private text' };
    expect(parseMisses(JSON.stringify(unsafe))).toEqual([]);
    expect(serializeMisses([unsafe])).toBe('');
    expect(serializeMisses([{ ...row, topic: 'private text' }])).toBe('');
  });
  it('merges counts without preserving arbitrary extra fields', () => {
    const merged = mergeMisses([row], [{ topic: 'rag', date: '2026-09-10', extra: 'private' }], '2026-09-10');
    expect(merged).toEqual([{ ...row, count: 4 }]);
    expect(parseMisses(serializeMisses(merged))).toEqual(merged);
  });
  it('rejects old observability events even if they have a known topic', () => {
    expect(sightingFrom({ source: { event: 'search_miss', q: 'private', topic: 'rag' }, timestamp: 100 })).toBeNull();
    expect(sightingFrom({ source: { event: 'search_miss', q: 'private' }, timestamp: 100 })).toBeNull();
  });
  it('reads safe event envelopes and drops unused fields', () => {
    expect(sightingFrom({ source: { event: 'search_miss', topic: 'rag', extra: 'ignored' }, timestamp: 1788901599409 }))
      .toEqual({ topic: 'rag', date: '2026-09-08', ts: 1788901599409 });
    expect(sightingFrom({ source: { message: '{"event":"search_miss","topic":"other"}' }, timestamp: 1788901599409 }).topic).toBe('other');
  });
});

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
      { topic: 'cloud', date: '2026-09-08', ts: now - 20_000 },
      { topic: 'cloud', date: '2026-09-08', ts: now - 10_000 },
      { topic: 'other', date: '2026-09-08', ts: now - 5_000 },
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
