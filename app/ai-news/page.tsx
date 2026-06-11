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

const POSTS_PER_PAGE = 10;

export default function AiNews() {
  // Embed page 1 in the static HTML at build time (SEO + instant first paint);
  // the client fetches /blog/pages/<n>.json chunks only when paginating.
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
  const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));

  return (
    <ClientLayout>
      <BlogPage initialPosts={posts.slice(0, POSTS_PER_PAGE)} pageCount={pageCount} />
    </ClientLayout>
  );
}
