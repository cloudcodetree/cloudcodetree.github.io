import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../components/ClientLayout';
import BlogPage from '../components/BlogPage';
import type { BlogPost } from '../components/blogShared';

// Preserved legacy route — the blog now lives at the site root (/). Keep this
// rendering so old /ai-news links don't 404, but canonicalize to / to avoid
// duplicate-content. Article pages remain at /ai-news/<id>.
export const metadata: Metadata = {
  title: 'AI News · CloudCodeTree',
  description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, developer workflow, and the custom-model stack.',
  alternates: {
    canonical: 'https://cloudcodetree.com/',
    types: { 'application/rss+xml': 'https://cloudcodetree.com/feed.xml' },
  },
};

export default function AiNews() {
  // Embed a SLIM (content-free) index of every post in the static HTML at build
  // time. The list/cards views paginate client-side from this with a reader-
  // selectable page size; the feed view lazy-loads full bodies from
  // /blog/posts.json only when selected. (Bodies are excluded here to keep the
  // page light — if the catalog grows very large, switch to a fetched index.)
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
  const slim = posts.map(({ content, ...rest }) => rest);

  return (
    <ClientLayout>
      <BlogPage posts={slim} />
    </ClientLayout>
  );
}
