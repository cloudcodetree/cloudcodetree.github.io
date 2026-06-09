import type { Metadata } from 'next';
import Redirect from '../components/Redirect';

// Legacy route — the blog moved to /ai-news. Keep a static stub that redirects
// so old /blog links (and search results) don't 404.
export const metadata: Metadata = {
  title: 'Moved to AI News | Chris Harper',
  alternates: { canonical: 'https://cloudcodetree.com/ai-news/' },
  robots: { index: false, follow: true },
};

export default function BlogMoved() {
  return <Redirect to="/ai-news/" />;
}
