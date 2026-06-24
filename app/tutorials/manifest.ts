// Hand-authored tutorials index. Each entry maps to an .mdx file under
// app/tutorials/(article)/<slug>/page.mdx. This is the list-page metadata;
// the .mdx file holds the actual (interactive) content. Separate from the
// auto-generated AI News blog on purpose.
//
// Tutorials are grouped into series. The canonical display title is
//   "<series>: <title> (Part <part> of <total>)"
// composed by fullTitle() — used for <title>/Open Graph so shared links read
// as a series. The UI shows series + part as an eyebrow and <title> as the head.

export interface Tutorial {
  slug: string;
  title: string;       // the subtitle (part-specific)
  series: string;      // shared title across the series
  part: number;        // 1-based position within the series
  excerpt: string;
  date: string;        // MM-DD-YYYY
  tags: string[];
  order: number;       // ascending = global learning-path order
  readTime: number;    // minutes
  image?: string;      // cover (site-absolute path or CDN URL)
}

export const tutorials: Tutorial[] = [
  {
    slug: 'build-a-rag-over-your-blog',
    title: 'Build a RAG Over Your Blog',
    series: 'RAG from Scratch',
    part: 1,
    excerpt:
      'Your first hands-on AI-engineering project: retrieve answers from your own posts with embeddings + cosine search — no vector DB, no API key. ~60 lines of Python.',
    date: '06-23-2026',
    tags: ['Tutorial', 'RAG', 'Embeddings', 'Python'],
    order: 1,
    readTime: 12,
    image: '/tutorials/covers/build-a-rag-over-your-blog.png',
  },
  {
    slug: 'vector-database-for-rag',
    title: 'Give Your RAG a Vector Database',
    series: 'RAG from Scratch',
    part: 2,
    excerpt:
      'Move from in-memory numpy to Chroma: embed once, persist to disk, query fast, and filter by metadata. The next step after the RAG intro.',
    date: '06-23-2026',
    tags: ['Tutorial', 'RAG', 'Vectors', 'Python'],
    order: 2,
    readTime: 10,
    image: '/tutorials/covers/vector-database-for-rag.png',
  },
  {
    slug: 'chunking-strategies-for-rag',
    title: 'Chunking Strategies',
    series: 'RAG from Scratch',
    part: 3,
    excerpt:
      'Chunking is the biggest lever on RAG quality. Compare whole-document, fixed-size, and paragraph-aware+overlap chunking on the same query — with real numbers.',
    date: '06-23-2026',
    tags: ['Tutorial', 'RAG', 'Python'],
    order: 3,
    readTime: 9,
    image: '/tutorials/covers/chunking-strategies-for-rag.png',
  },
  {
    slug: 'hybrid-search-for-rag',
    title: 'Hybrid Search',
    series: 'RAG from Scratch',
    part: 4,
    excerpt:
      'Vector search understands meaning; BM25 nails exact tokens. Each has a blind spot. Fuse them with Reciprocal Rank Fusion so retrieval stays correct when either one is wrong.',
    date: '06-23-2026',
    tags: ['Tutorial', 'RAG', 'Search', 'Python'],
    order: 4,
    readTime: 10,
    image: '/tutorials/covers/hybrid-search-for-rag.png',
  },
  {
    slug: 'reranking-for-rag',
    title: 'Reranking',
    series: 'RAG from Scratch',
    part: 5,
    excerpt:
      'A bi-encoder retrieves fast but is fooled by negation; a cross-encoder reads query and passage together and fixes it. Retrieve wide, rerank narrow — with the recall ceiling made concrete.',
    date: '06-23-2026',
    tags: ['Tutorial', 'RAG', 'Search', 'Python'],
    order: 5,
    readTime: 10,
    image: '/tutorials/covers/reranking-for-rag.png',
  },
  {
    slug: 'evaluating-rag',
    title: 'Evaluating Retrieval',
    series: 'RAG from Scratch',
    part: 6,
    excerpt:
      'Stop guessing whether a change helped. Build a golden query set, score retrieval with Hit@k and MRR, then A/B two retrievers over the same set — the capstone of the RAG track.',
    date: '06-23-2026',
    tags: ['Tutorial', 'RAG', 'Evaluation', 'Python'],
    order: 6,
    readTime: 11,
    image: '/tutorials/covers/evaluating-rag.png',
  },
  {
    slug: 'fine-tuning-vs-rag',
    title: 'Fine-Tuning vs RAG',
    series: 'Fine-Tuning & Serving',
    part: 1,
    excerpt:
      'The most common AI-engineering fork: retrieve knowledge (RAG) or change the model itself (fine-tuning)? A decision framework — when each wins, when to combine them, and what fine-tuning cannot do.',
    date: '06-24-2026',
    tags: ['Tutorial', 'Fine-tuning', 'RAG'],
    order: 7,
    readTime: 8,
    image: '/tutorials/covers/fine-tuning-vs-rag.png',
  },
  {
    slug: 'lora-qlora-fine-tuning',
    title: 'LoRA & QLoRA on One GPU',
    series: 'Fine-Tuning & Serving',
    part: 2,
    excerpt:
      'How parameter-efficient fine-tuning works: LoRA trains tiny adapter matrices instead of the whole model, and QLoRA adds 4-bit quantization so an 8B model fits a free Colab GPU. Concept + an official runnable notebook.',
    date: '06-24-2026',
    tags: ['Tutorial', 'Fine-tuning', 'LoRA'],
    order: 8,
    readTime: 9,
    image: '/tutorials/covers/lora-qlora-fine-tuning.png',
  },
  {
    slug: 'serve-with-vllm',
    title: 'Serve a Model with vLLM',
    series: 'Fine-Tuning & Serving',
    part: 3,
    excerpt:
      'Turn a fine-tuned model into a fast, OpenAI-compatible API. Merge the LoRA adapter, start a vLLM server with one command, and call it from the OpenAI client — a drop-in for your existing code.',
    date: '06-24-2026',
    tags: ['Tutorial', 'Serving', 'vLLM'],
    order: 9,
    readTime: 8,
    image: '/tutorials/covers/serve-with-vllm.png',
  },
];

/** Total parts in a tutorial's series. */
export function seriesTotal(series: string): number {
  return tutorials.filter((t) => t.series === series).length;
}

/** Canonical display title: "Series: Subtitle (Part N of M)". */
export function fullTitle(t: Tutorial): string {
  return `${t.series}: ${t.title} (Part ${t.part} of ${seriesTotal(t.series)})`;
}
