import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../components/ClientLayout';
import SavedPosts from '../components/SavedPosts';
import type { BlogPost } from '../components/blogShared';

// Per-reader, so never indexed and never linked from the sitemap. The exported
// HTML is the empty shell every reader shares; the saved set arrives after
// hydration from the reader's own JWT, so this file can never carry one
// reader's list to another.
export const metadata: Metadata = {
  title: 'Saved · AI News · CloudCodeTree',
  description: 'Posts you saved to read later.',
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
  const slim = posts.map(({ content, ...rest }) => rest);
  return (
    <ClientLayout>
      <SavedPosts posts={slim} />
    </ClientLayout>
  );
}
