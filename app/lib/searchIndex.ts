'use client';

import MiniSearch from 'minisearch';
import { rrfMerge } from './searchMerge';

export interface SearchDoc { id: string; title: string; excerpt: string; tags: string[]; date: string }

interface Loaded { docs: Map<string, SearchDoc>; keyword(q: string): string[] }

const SEMANTIC_TIMEOUT_MS = 2000;
let loading: Promise<Loaded> | null = null;

/** Fetch + index once per page load; every SearchBox shares it. */
export function loadIndex(): Promise<Loaded> {
  if (!loading) {
    loading = fetch('/blog/search-index.json')
      .then((r) => { if (!r.ok) throw new Error(`search-index ${r.status}`); return r.json() as Promise<SearchDoc[]>; })
      .then((list) => {
        const mini = new MiniSearch<SearchDoc>({
          fields: ['title', 'excerpt', 'tags'],
          storeFields: [],
          searchOptions: { boost: { title: 2 }, prefix: true, fuzzy: 0.2 },
        });
        mini.addAll(list);
        const docs = new Map(list.map((d) => [d.id, d]));
        return { docs, keyword: (q: string) => mini.search(q).map((r) => String(r.id)) };
      })
      .catch((e) => { loading = null; throw e; });
  }
  return loading;
}

async function semantic(q: string, signal?: AbortSignal): Promise<string[] | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), SEMANTIC_TIMEOUT_MS);
  const onAbort = () => ctl.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { results: { id: string }[] };
    return body.results.map((r) => r.id);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Keyword results immediately merged with semantic ones; semantic:false means keyword-only. */
export async function hybridSearch(q: string, opts: { signal?: AbortSignal } = {}): Promise<{ ids: string[]; semantic: boolean }> {
  const { keyword } = await loadIndex();
  const kw = keyword(q);
  const sem = await semantic(q, opts.signal);
  if (!sem) return { ids: kw, semantic: false };
  return { ids: rrfMerge([kw, sem]), semantic: true };
}
