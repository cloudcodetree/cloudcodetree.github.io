import type { Metadata } from 'next';
import TutorialsList from '../../components/TutorialsList';
import { tutorials } from '../manifest';

export const metadata: Metadata = {
  title: 'All Tutorials · CloudCodeTree',
  description: 'Every CloudCodeTree tutorial as an individual card — RAG, embeddings, fine-tuning, agents, and the full DealFinder AI-engineering course.',
  alternates: {
    canonical: 'https://cloudcodetree.com/tutorials/all/',
    types: { 'application/rss+xml': 'https://cloudcodetree.com/tutorials/feed.xml' },
  },
  openGraph: {
    title: 'All Tutorials · CloudCodeTree',
    description: 'Every CloudCodeTree tutorial as an individual card.',
    url: 'https://cloudcodetree.com/tutorials/all/',
    siteName: 'CloudCodeTree',
    type: 'website',
  },
};

export default function AllTutorialsPage() {
  // Newest first (descending order), mirroring the AI News blog.
  const ordered = [...tutorials].sort((a, b) => b.order - a.order);
  return <TutorialsList tutorials={ordered} variant="all" />;
}
