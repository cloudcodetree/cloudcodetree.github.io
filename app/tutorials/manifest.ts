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
  {
    slug: 'dev-machine-in-your-pocket',
    title: 'Your Whole Dev Machine, In Your Pocket',
    series: 'Claude Code Anywhere',
    part: 1,
    excerpt:
      'Self-host a free, secure pipeline from your phone to your real Mac with Tailscale, tmux, and one isolated Claude Code session per project. Your actual files and full toolchain — not a cloud sandbox.',
    date: '06-25-2026',
    tags: ['Tutorial', 'Claude Code', 'tmux', 'Tailscale', 'SSH'],
    order: 10,
    readTime: 12,
    image: '/tutorials/covers/dev-machine-in-your-pocket.png',
  },
  {
    slug: 'dealfinder-data-layer',
    title: 'Build the Data Layer',
    series: 'DealFinder — AI Engineering',
    part: 1,
    excerpt:
      'Ingest messy product/price data from a dataset, a live API, and a scraper behind one DealSource interface; normalize, dedup, and store it — the foundation of an AI deal-finder.',
    date: '06-29-2026',
    tags: ['Tutorial', 'DealFinder', 'Data Engineering', 'Python'],
    order: 11,
    readTime: 10,
    image: '/tutorials/covers/dealfinder-data-layer.png',
  },
  {
    slug: 'dealfinder-how-llms-work',
    title: 'How LLMs Actually Work',
    series: 'DealFinder — AI Engineering',
    part: 2,
    excerpt:
      'The LLM literacy you need before wiring a model into DealFinder: tokenization, embeddings, attention, and sampling — shown, not just described.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'LLMs', 'Concepts'],
    order: 12,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-how-llms-work.png',
  },
  {
    slug: 'dealfinder-deal-model',
    title: 'Is It a Good Deal?',
    series: 'DealFinder — AI Engineering',
    part: 3,
    excerpt:
      'Train a price model from scratch (the normal equation, no scikit-learn) on DealFinder\'s catalog, evaluate it with MAE and R-squared, and use it to flag underpriced listings.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Machine Learning', 'Python'],
    order: 13,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-deal-model.png',
  },
];

/** One-line description of each series, shown in the course header. */
export const SERIES_INFO: Record<string, { blurb: string }> = {
  'RAG from Scratch': {
    blurb:
      'Build retrieval from the ground up — embeddings, a vector DB, chunking, hybrid search, reranking, and evaluation — one locally-tested step at a time.',
  },
  'Fine-Tuning & Serving': {
    blurb:
      'Change the model itself: when to fine-tune vs. retrieve, how LoRA/QLoRA work, and how to serve the result behind an OpenAI-compatible API.',
  },
  'DealFinder — AI Engineering': {
    blurb:
      'Build a real AI deal-finder end to end — data, LLM literacy, an ML scoring model, retrieval, an agent, and shipping it — the capstone that ties every skill together.',
  },
};

/** Total parts in a tutorial's series. */
export function seriesTotal(series: string): number {
  return tutorials.filter((t) => t.series === series).length;
}

/** All parts of a series, in reading order. */
export function seriesParts(series: string): Tutorial[] {
  return tutorials.filter((t) => t.series === series).sort((a, b) => a.part - b.part);
}

/** Canonical display title: "Series: Subtitle (Part N of M)". */
export function fullTitle(t: Tutorial): string {
  return `${t.series}: ${t.title} (Part ${t.part} of ${seriesTotal(t.series)})`;
}
