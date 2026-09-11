'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BlogPage from './BlogPage';
import type { BlogPost } from './blogShared';
import { usePostArchive, type PostArchive } from '../lib/usePostArchive';
import { Alert, Button } from '@mui/material';
import { hybridSearch } from '../lib/searchIndex';

interface Props { posts: BlogPost[]; archive?: PostArchive }

/**
 * Reads the query from the URL, so searching again from this page (the box
 * pushes a new ?q=) re-runs the search instead of leaving the first results on
 * screen. Requires a <Suspense> boundary around it — useSearchParams() opts the
 * subtree into client-side rendering.
 */
export default function SearchResults({ posts: initial, archive }: Props) {
  const { posts, loading, error, retry } = usePostArchive(initial, archive);
  const q = (useSearchParams().get('q') || '').trim();
  const [state, setState] = useState<{ ids: string[]; semantic: boolean; done: boolean }>({ ids: [], semantic: false, done: false });

  useEffect(() => {
    if (!q) { setState({ ids: [], semantic: false, done: true }); return; }
    setState({ ids: [], semantic: false, done: false });
    // A slow pass for an earlier query must never overwrite a newer one's rows.
    const ctl = new AbortController();
    // This page is a search the reader committed to (they submitted the box or
    // followed a ?q= link), so it is the one search worth recording on a miss.
    hybridSearch(q, { signal: ctl.signal, deliberate: true })
      .then((r) => { if (!ctl.signal.aborted) setState({ ...r, done: true }); })
      .catch(() => { if (!ctl.signal.aborted) setState({ ids: [], semantic: false, done: true }); });
    return () => ctl.abort();
  }, [q]);

  const byId = new Map(posts.map((p) => [p.id, p]));
  const ordered = state.ids.map((id) => byId.get(id)).filter((p): p is BlogPost => Boolean(p));
  const intro = !q
    ? 'Type a query in the box below.'
    : !state.done || loading
      ? `Searching for “${q}”…`
      : `${ordered.length} result${ordered.length === 1 ? '' : 's'} for “${q}” · ${state.semantic ? 'keyword + meaning' : 'keyword only'}`;

  if (error) return <Alert severity="warning" action={<Button onClick={retry}>Retry</Button>}>Search results could not be loaded.</Alert>;
  return (
    <BlogPage
      posts={ordered}
      heading="Search"
      intro={intro}
      emptyMessage={!q ? '// enter a search above' : state.done && !loading ? '// nothing matched — try fewer or different words' : '// searching…'}
    />
  );
}
