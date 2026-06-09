import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import BlogPage from '../components/BlogPage';

export const metadata: Metadata = {
  title: 'AI News | Chris Harper',
  description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, and developer workflow, curated by Chris Harper.',
  alternates: {
    canonical: 'https://cloudcodetree.com/ai-news/',
    types: { 'application/rss+xml': 'https://cloudcodetree.com/feed.xml' },
  },
};

export default function AiNews() {
  return (
    <ClientLayout>
      <BlogPage />
    </ClientLayout>
  );
}
