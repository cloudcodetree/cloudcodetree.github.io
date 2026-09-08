'use client';

import { useEffect, useState } from 'react';
import BlogPage from './BlogPage';
import type { BlogPost } from './blogShared';
import { hybridSearch } from '../lib/searchIndex';

interface Props { posts: BlogPost[] }

export default function SearchResults({ posts }: Props) {
  const [q, setQ] = useState('');
  const [state, setState] = useState<{ ids: string[]; semantic: boolean; done: boolean }>({ ids: [], semantic: false, done: false });

  useEffect(() => {
    const term = (new URLSearchParams(window.location.search).get('q') || '').trim();
    setQ(term);
    if (!term) { setState({ ids: [], semantic: false, done: true }); return; }
    document.title = `“${term}” · Search · AI News`;
    hybridSearch(term)
      .then((r) => setState({ ...r, done: true }))
      .catch(() => setState({ ids: [], semantic: false, done: true }));
  }, []);

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
