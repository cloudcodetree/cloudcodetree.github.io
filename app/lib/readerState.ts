'use client';

// Per-reader state for AI News posts — what has been opened, what is saved.
//
// The browser talks to Supabase directly with the reader's own JWT; RLS on
// public.reader_state (migration 0005) is the whole enforcement story. There is
// no Worker hop and no service key, exactly as demo_events and profiles work.
//
// Two rules shape this module:
//
//  1. A signed-out reader must produce NO query and NO extra bytes. The
//     session probe is a synchronous localStorage check and supabase-js is
//     imported dynamically behind it, so importing this module from BlogPage
//     does not drag the auth SDK into the list page's chunk (the same reason
//     GlobalAuth loads AuthWidget with next/dynamic).
//  2. Nothing here throws. Reader state is a nicety layered on a static page;
//     a failure dims nothing and breaks nothing.

export interface ReaderRow {
  post_id: string;
  saved: boolean;
  read_at: string | null;
}

export type ReaderStateMap = Map<string, ReaderRow>;

/** A post annotated with this reader's state. */
export type WithReaderState<T> = T & { isRead: boolean; isSaved: boolean };

/**
 * Cheap synchronous "might be signed in" probe — the same localStorage check
 * GlobalAuth uses to decide whether to load supabase-js at all. False means we
 * are certainly signed out, so no client is constructed and no request leaves
 * the page. MUST only be consulted from an effect: during render it would
 * disagree with the server-rendered (always signed-out) HTML and break
 * hydration.
 */
export function hasReaderSession(): boolean {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
  } catch {
    return false;
  }
}

/** The signed-in reader's id, or null. Never throws; loads supabase-js lazily. */
async function currentUserId(): Promise<string | null> {
  if (!hasReaderSession()) return null;
  try {
    const { supabase } = await import('./supabaseClient');
    const { data } = await supabase().auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

/**
 * One query per page load, shared: /saved renders BlogPage, and both want the
 * same rows. Callers each get their OWN Map copy so an optimistic update in one
 * component can never alias another's state.
 */
let inFlight: Promise<ReaderStateMap> | null = null;

async function fetchReaderState(): Promise<ReaderStateMap> {
  const empty: ReaderStateMap = new Map();
  if (!(await currentUserId())) return empty;
  try {
    const { supabase } = await import('./supabaseClient');
    // No .eq('user_id', …): the select policy already scopes this to the caller,
    // and a redundant predicate would be a second place to get it wrong.
    const { data, error } = await supabase().from('reader_state').select('post_id, saved, read_at');
    if (error || !data) return empty;
    const map: ReaderStateMap = new Map();
    (data as ReaderRow[]).forEach((row) => map.set(row.post_id, row));
    return map;
  } catch {
    return empty;
  }
}

/**
 * Keep the shared copy honest after a successful write, so a client-side
 * navigation back to a post the reader just saved does not read a stale row.
 * Safe to mutate: every caller of loadReaderState() got its own copy.
 */
function patchCache(postId: string, patch: Partial<ReaderRow>): void {
  if (!inFlight) return;
  void inFlight.then((map) => {
    const current = map.get(postId) ?? { post_id: postId, saved: false, read_at: null };
    map.set(postId, { ...current, ...patch });
  });
}

/**
 * Every row this reader owns, keyed by post id. The caller holds the Map so
 * pagination, topic filtering and the view switcher never re-query. Resolves to
 * an empty Map when signed out or on any error — it never rejects.
 */
export async function loadReaderState(): Promise<ReaderStateMap> {
  inFlight ??= fetchReaderState();
  const shared = await inFlight;
  const copy: ReaderStateMap = new Map();
  shared.forEach((row, id) => copy.set(id, row));
  return copy;
}

/**
 * Record that the reader opened this post. Fire-and-forget: never awaited
 * before render, failures swallowed, exactly as the Worker's logDemoOpen is.
 *
 * The payload deliberately carries only user_id, post_id and read_at. PostgREST
 * turns an upsert into `on conflict do update set <the columns sent>`, so
 * `saved` is untouched — re-reading a post can never unsave it.
 */
const marked = new Set<string>();

export function markRead(postId: string): void {
  if (!hasReaderSession()) return;
  // Once per post per page load. An article's effect can run more than once for
  // reasons that have nothing to do with the reader — StrictMode's double
  // invoke in dev, AnimatePresence remounting the route — and each extra run
  // would be another identical write. Cleared again if the write fails, so a
  // later mount still gets its chance.
  if (marked.has(postId)) return;
  marked.add(postId);
  void (async () => {
    const userId = await currentUserId();
    if (!userId) { marked.delete(postId); return; }
    try {
      const { supabase } = await import('./supabaseClient');
      const readAt = new Date().toISOString();
      const { error } = await supabase()
        .from('reader_state')
        .upsert({ user_id: userId, post_id: postId, read_at: readAt, updated_at: readAt }, { onConflict: 'user_id,post_id' });
      if (error) marked.delete(postId);
      else patchCache(postId, { read_at: readAt });
    } catch {
      marked.delete(postId);   // best-effort: let a later mount retry
    }
  })();
}

/**
 * Save or unsave a post. Resolves true on success and false on any failure, so
 * an optimistic caller knows to revert. Unsaving writes saved = false rather
 * than deleting the row (there is no delete policy) — read state survives it.
 */
export async function setSaved(postId: string, saved: boolean): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  try {
    const { supabase } = await import('./supabaseClient');
    const { error } = await supabase()
      .from('reader_state')
      .upsert({ user_id: userId, post_id: postId, saved, updated_at: new Date().toISOString() }, { onConflict: 'user_id,post_id' });
    if (!error) patchCache(postId, { saved });
    return !error;
  } catch {
    return false;
  }
}

// ---- pure helpers (unit-tested in readerState.test.ts) ---------------------

/** Annotate a post list with the reader's state. Order and length preserved. */
export function applyReaderState<T extends { id: string }>(posts: T[], state: ReaderStateMap): WithReaderState<T>[] {
  return posts.map((post) => {
    const row = state.get(post.id);
    return { ...post, isRead: !!(row && row.read_at), isSaved: !!(row && row.saved) };
  });
}

/**
 * The Hide-read filter. A no-op (same array identity) when `hide` is false, so
 * it composes with search and topic filtering instead of replacing them.
 */
export function filterHideRead<T extends { isRead: boolean }>(posts: T[], hide: boolean): T[] {
  return hide ? posts.filter((post) => !post.isRead) : posts;
}
