import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../components/ClientLayout';
import BlogPage from '../components/BlogPage';
import type { BlogPost } from '../components/blogShared';

export const metadata: Metadata = {
  title: 'AI News | Chris Harper',
  description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, and developer workflow, curated by Chris Harper.',
  alternates: {
    canonical: 'https://cloudcodetree.com/ai-news/',
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
