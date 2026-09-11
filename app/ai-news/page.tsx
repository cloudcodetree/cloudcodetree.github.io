import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import BlogPage from '../components/BlogPage';
import { blogListing } from '../lib/blogArchive';

// Preserved legacy route — the blog now lives at the site root (/). Keep this
// rendering so old /ai-news links don't 404, but canonicalize to / to avoid
// duplicate-content. Article pages remain at /ai-news/<id>.
export const metadata: Metadata = {
  title: 'AI News · CloudCodeTree',
  description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, developer workflow, and the custom-model stack.',
  alternates: {
    canonical: 'https://cloudcodetree.com/',
    types: { 'application/rss+xml': 'https://cloudcodetree.com/ai-news/feed.xml' },
  },
};

export default function AiNews() {
  // Prerender the first page; cacheable chunks supply the rest of the archive.
  const { initial, archive } = blogListing();

  return (
    <ClientLayout>
      <BlogPage posts={initial} archive={archive} />
    </ClientLayout>
  );
}
