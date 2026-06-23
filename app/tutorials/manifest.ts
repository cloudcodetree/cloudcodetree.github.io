// Hand-authored tutorials index. Each entry maps to an .mdx file under
// app/tutorials/(article)/<slug>/page.mdx. This is the list-page metadata;
// the .mdx file holds the actual (interactive) content. Separate from the
// auto-generated AI News blog on purpose.

export interface Tutorial {
  slug: string;
  title: string;
  excerpt: string;
  date: string;        // MM-DD-YYYY
  tags: string[];
  order: number;       // ascending = learning-path order
  readTime: number;    // minutes
  image?: string;      // optional cover (site-absolute or CDN URL)
}

export const tutorials: Tutorial[] = [
  {
    slug: 'build-a-rag-over-your-blog',
    title: 'Build a RAG Pipeline Over Your Own Blog',
    excerpt:
      'Your first hands-on AI-engineering project: retrieve answers from your own posts with embeddings + cosine search — no vector DB, no API key. ~60 lines of Python.',
    date: '06-23-2026',
    tags: ['Tutorial', 'RAG', 'Embeddings', 'Python'],
    order: 1,
    readTime: 12,
  },
];
