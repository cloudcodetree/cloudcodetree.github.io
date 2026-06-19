import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from './components/ClientLayout';
import BlogPage from './components/BlogPage';
import type { BlogPost } from './components/blogShared';

export const metadata: Metadata = {
  title: 'AI News · CloudCodeTree',
  description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, developer workflow, and the custom-model stack.',
  alternates: {
    canonical: 'https://cloudcodetree.com/',
    types: { 'application/rss+xml': 'https://cloudcodetree.com/feed.xml' },
  },
};

// The AI News blog is the front door. Embed a slim (content-free) index at build
// time; the list paginates client-side, the feed view lazy-loads bodies.
export default function Home() {
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
  const slim = posts.map(({ content, ...rest }) => rest);

  return (
    <ClientLayout>
      <BlogPage posts={slim} />
    </ClientLayout>
  );
}
