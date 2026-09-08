import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../../components/ClientLayout';
import SearchResults from '../../components/SearchResults';
import type { BlogPost } from '../../components/blogShared';

// Query-driven, so never indexed; the canonical for any query is the list itself.
export const metadata: Metadata = {
  title: 'Search · AI News · CloudCodeTree',
  description: 'Search every AI News post by keyword and by meaning.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://cloudcodetree.com/' },
};

export default function SearchPage() {
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
  const slim = posts.map(({ content, ...rest }) => rest);
  return (
    <ClientLayout>
      <SearchResults posts={slim} />
    </ClientLayout>
  );
}
