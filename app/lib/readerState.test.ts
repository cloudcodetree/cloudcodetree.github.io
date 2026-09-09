import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyReaderState, filterHideRead, loadReaderState, markRead, resetReaderState,
  type ReaderRow,
} from './readerState';

// The one place supabase-js is reachable from this module; stubbing it lets the
// caching behaviour be observed by counting real calls rather than by exposing
// module internals for the test's benefit.
const calls = { select: 0, upsert: 0 };
vi.mock('./supabaseClient', () => ({
  supabase: () => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: 'reader-1' } } } }) },
    from: () => ({
      select: async () => { calls.select++; return { data: [] as ReaderRow[], error: null }; },
      upsert: async () => { calls.upsert++; return { error: null }; },
    }),
  }),
}));

/** hasReaderSession() only ever does Object.keys() on this. */
function signIn() {
  (globalThis as unknown as { localStorage: unknown }).localStorage = { 'sb-proj-auth-token': '{}' };
}
const settle = () => new Promise((r) => setTimeout(r, 0));

interface P { id: string; title: string }
const posts: P[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
];

const state = new Map<string, ReaderRow>([
  ['a', { post_id: 'a', saved: false, read_at: '2026-09-09T00:00:00Z' }],
  ['b', { post_id: 'b', saved: true, read_at: null }],
]);

describe('applyReaderState', () => {
  it('marks a post with a read_at as read', () => {
    expect(applyReaderState(posts, state)[0]).toEqual({ id: 'a', title: 'A', isRead: true, isSaved: false });
  });

  it('marks a saved post as saved and not read when read_at is null', () => {
    expect(applyReaderState(posts, state)[1]).toEqual({ id: 'b', title: 'B', isRead: false, isSaved: true });
  });

  it('leaves a post with no row neither read nor saved', () => {
    expect(applyReaderState(posts, state)[2]).toEqual({ id: 'c', title: 'C', isRead: false, isSaved: false });
  });

  it('preserves order and length', () => {
    expect(applyReaderState(posts, state).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('is a pure annotation — the input posts are not mutated', () => {
    const input = [{ id: 'a', title: 'A' }];
    applyReaderState(input, state);
    expect(input[0]).toEqual({ id: 'a', title: 'A' });
  });

  it('annotates everything as unread with an empty map (the signed-out shape)', () => {
    const out = applyReaderState(posts, new Map());
    expect(out.every((p) => !p.isRead && !p.isSaved)).toBe(true);
  });
});

describe('filterHideRead', () => {
  const annotated = applyReaderState(posts, state);

  it('drops read posts when hiding', () => {
    expect(filterHideRead(annotated, true).map((p) => p.id)).toEqual(['b', 'c']);
  });

  it('is a no-op when not hiding — same array identity', () => {
    expect(filterHideRead(annotated, false)).toBe(annotated);
  });

  it('composes with an already-filtered list rather than re-deriving it', () => {
    // A topic/search filter has already narrowed the list to a and c.
    const narrowed = annotated.filter((p) => p.id !== 'b');
    expect(filterHideRead(narrowed, true).map((p) => p.id)).toEqual(['c']);
  });

  it('can empty the list when everything is read', () => {
    const allRead = applyReaderState(posts, new Map<string, ReaderRow>([
      ['a', { post_id: 'a', saved: false, read_at: 'x' }],
      ['b', { post_id: 'b', saved: false, read_at: 'x' }],
      ['c', { post_id: 'c', saved: false, read_at: 'x' }],
    ]));
    expect(filterHideRead(allRead, true)).toEqual([]);
  });
});

describe('resetReaderState', () => {
  beforeEach(() => {
    signIn();
    resetReaderState();
    calls.select = 0;
    calls.upsert = 0;
  });

  it('a second loadReaderState reuses the cached query', async () => {
    await loadReaderState();
    await loadReaderState();
    expect(calls.select).toBe(1);
  });

  it('clears the row cache, so the next load queries again', async () => {
    await loadReaderState();
    resetReaderState();
    await loadReaderState();
    expect(calls.select).toBe(2);
  });

  it('hands every caller its own Map, not the shared one', async () => {
    const a = await loadReaderState();
    const b = await loadReaderState();
    expect(a).not.toBe(b);
  });

  it('markRead writes once per post while the session lasts', async () => {
    markRead('post-a');
    markRead('post-a');
    await settle();
    expect(calls.upsert).toBe(1);
  });

  it('clears the marked set, so the next reader can mark the same post read', async () => {
    markRead('post-a');
    await settle();
    resetReaderState();
    markRead('post-a');
    await settle();
    expect(calls.upsert).toBe(2);
  });
});
