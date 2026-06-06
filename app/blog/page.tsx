import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
import BlogPage from '../components/BlogPage';

export const metadata: Metadata = {
  title: 'AI News | Chris Harper',
  description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, and developer workflow, curated by Chris Harper.',
};

export default function Blog() {
  return (
    <ClientLayout>
      <BlogPage />
    </ClientLayout>
  );
}
