import { Suspense } from 'react';
import type { Metadata } from 'next';
import ClientLayout from '../../components/ClientLayout';
import SearchResults from '../../components/SearchResults';
import { blogListing } from '../../lib/blogArchive';

// Query-driven, so never indexed; the canonical for any query is the list itself.
export const metadata: Metadata = {
  title: 'Search · AI News · CloudCodeTree',
  description: 'Search every AI News post by keyword and by meaning.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://cloudcodetree.com/' },
};

export default function SearchPage() {
  const { initial, archive } = blogListing();
  return (
    <ClientLayout>
      {/* SearchResults reads ?q= with useSearchParams(), which a static export
          requires to sit under a Suspense boundary. */}
      <Suspense fallback={<p>Loading search…</p>}>
        <SearchResults posts={initial} archive={archive} />
      </Suspense>
    </ClientLayout>
  );
}
