import type { Metadata } from 'next';
import ClientLayout from './components/ClientLayout';
import BlogPage from './components/BlogPage';
import { blogListing } from './lib/blogArchive';

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
  const { initial, archive } = blogListing();

  return (
    <ClientLayout>
      <BlogPage posts={initial} archive={archive} />
    </ClientLayout>
  );
}
