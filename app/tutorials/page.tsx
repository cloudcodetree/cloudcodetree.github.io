import type { Metadata } from 'next';
import TutorialsList from '../components/TutorialsList';
import { tutorials } from './manifest';

export const metadata: Metadata = {
  title: 'Tutorials · CloudCodeTree',
  description: 'Hand-written, hands-on tutorials for software engineers getting into agentic AI development and AI engineering — RAG, embeddings, fine-tuning, and more.',
  alternates: { canonical: 'https://cloudcodetree.com/tutorials/' },
  openGraph: {
    title: 'Tutorials · CloudCodeTree',
    description: 'Hands-on tutorials for agentic AI development and AI engineering.',
    url: 'https://cloudcodetree.com/tutorials/',
    siteName: 'CloudCodeTree',
    type: 'website',
  },
};

export default function TutorialsPage() {
  // Learning-path order (ascending). The list UI mirrors the blog's.
  const ordered = [...tutorials].sort((a, b) => a.order - b.order);
  return <TutorialsList tutorials={ordered} />;
}
