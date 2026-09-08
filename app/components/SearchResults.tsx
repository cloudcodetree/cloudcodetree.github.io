'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BlogPage from './BlogPage';
import type { BlogPost } from './blogShared';
import { hybridSearch } from '../lib/searchIndex';

interface Props { posts: BlogPost[] }

/**
 * Reads the query from the URL, so searching again from this page (the box
 * pushes a new ?q=) re-runs the search instead of leaving the first results on
 * screen. Requires a <Suspense> boundary around it — useSearchParams() opts the
 * subtree into client-side rendering.
 */
export default function SearchResults({ posts }: Props) {
  const q = (useSearchParams().get('q') || '').trim();
  const [state, setState] = useState<{ ids: string[]; semantic: boolean; done: boolean }>({ ids: [], semantic: false, done: false });

  useEffect(() => {
    if (!q) { setState({ ids: [], semantic: false, done: true }); return; }
    setState({ ids: [], semantic: false, done: false });
    // A slow pass for an earlier query must never overwrite a newer one's rows.
    const ctl = new AbortController();
    hybridSearch(q, { signal: ctl.signal })
      .then((r) => { if (!ctl.signal.aborted) setState({ ...r, done: true }); })
      .catch(() => { if (!ctl.signal.aborted) setState({ ids: [], semantic: false, done: true }); });
    return () => ctl.abort();
  }, [q]);

  const byId = new Map(posts.map((p) => [p.id, p]));
  const ordered = state.ids.map((id) => byId.get(id)).filter((p): p is BlogPost => Boolean(p));
  const intro = !q
    ? 'Type a query in the box below.'
    : !state.done
      ? `Searching for “${q}”…`
      : `${ordered.length} result${ordered.length === 1 ? '' : 's'} for “${q}” · ${state.semantic ? 'keyword + meaning' : 'keyword only'}`;

  return (
    <BlogPage
      posts={ordered}
      heading="Search"
      intro={intro}
      emptyMessage={!q ? '// enter a search above' : state.done ? '// nothing matched — try fewer or different words' : '// searching…'}
    />
  );
}
