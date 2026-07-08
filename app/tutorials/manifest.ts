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
    title: 'Data layer, normalization & the snapshot',
    series: 'DealFinder — AI Engineering',
    part: 1,
    excerpt:
      'Build the Google Shopping connector, normalize the retailer-polluted brand field, dedup the same headphones listed at two prices, and freeze the 270-item electronics snapshot the whole course runs on.',
    date: '06-29-2026',
    tags: ['Tutorial', 'DealFinder', 'Data Engineering', 'Python'],
    order: 11,
    readTime: 10,
    image: '/tutorials/covers/dealfinder-data-layer.png',
  },
  {
    slug: 'dealfinder-how-llms-work',
    title: 'How LLMs actually work',
    series: 'DealFinder — AI Engineering',
    part: 2,
    excerpt:
      'The LLM literacy you need before wiring a model into DealFinder: tokenization, embeddings, attention, and sampling — shown with real consumer-electronics data, not just described.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'LLMs', 'Concepts'],
    order: 12,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-how-llms-work.png',
  },
  {
    slug: 'dealfinder-deal-model',
    title: 'Is it a good deal? — median vs. model',
    series: 'DealFinder — AI Engineering',
    part: 3,
    excerpt:
      'Train a price model from scratch (the normal equation, no scikit-learn) on the electronics snapshot, then blend its residual with the naive median signal to separate a genuine budget pick from a too-good-to-be-true trap.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Machine Learning', 'Python'],
    order: 13,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-deal-model.png',
  },
  {
    slug: 'dealfinder-recommender',
    title: 'What you’ll like next — recommenders',
    series: 'DealFinder — AI Engineering',
    part: 4,
    excerpt:
      'Content + collaborative recommenders over real title embeddings: "more like the Sony WH-1000XM5" returns the XM6 and other real audio.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Recommenders', 'Python'],
    order: 14,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-recommender.png',
  },
  {
    slug: 'dealfinder-search',
    title: 'Semantic search that knows a deal',
    series: 'DealFinder — AI Engineering',
    part: 5,
    excerpt:
      'Cosine + BM25 + RRF over the snapshot, value-reranked by the two-signal deal score so relevant AND cheap rises: Anker Q20i tops the results.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Search', 'Embeddings', 'Python'],
    order: 15,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-search.png',
  },
  {
    slug: 'dealfinder-extraction',
    title: 'Messy listings into clean JSON',
    series: 'DealFinder — AI Engineering',
    part: 6,
    excerpt:
      'Turn retailer-polluted titles into schema-validated specs: extract the true manufacturer from the title, with a deterministic rule fallback.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'LLMs', 'Structured Output', 'Python'],
    order: 16,
    readTime: 10,
    image: '/tutorials/covers/dealfinder-extraction.png',
  },
  {
    slug: 'dealfinder-live-sources',
    title: 'Live multi-source connectors',
    series: 'DealFinder — AI Engineering',
    part: 7,
    excerpt:
      'Wire real marketplace APIs (eBay Browse OAuth, RapidAPI, Best Buy) behind one DealSource interface, with affiliate URLs and graceful auth.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'APIs', 'OAuth', 'Python'],
    order: 17,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-live-sources.png',
  },
  {
    slug: 'dealfinder-scraping',
    title: 'Scraping responsibly',
    series: 'DealFinder — AI Engineering',
    part: 8,
    excerpt:
      'When an API is not enough: Apify actors, Shopify /products.json, and Firecrawl — plus robots.txt/ToS reality and when to scrape vs. call an API.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Scraping', 'Python'],
    order: 18,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-scraping.png',
  },
  {
    slug: 'dealfinder-aggregation',
    title: 'Tiered aggregation & resilience',
    series: 'DealFinder — AI Engineering',
    part: 9,
    excerpt:
      'Query cheap/reliable sources first, early-stop at enough deduped results, and bench any source that throttles — the anti-throttle aggregator that powers the snapshot.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Resilience', 'Python'],
    order: 19,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-aggregation.png',
  },
  {
    slug: 'dealfinder-finetune',
    title: 'Fine-tune the extractor with QLoRA',
    series: 'DealFinder — AI Engineering',
    part: 10,
    excerpt:
      'When prompting plateaus: the QLoRA decision framework and recipe to fine-tune the extractor on real electronics listings (anchored; runs in a GPU notebook).',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Fine-tuning', 'QLoRA'],
    order: 20,
    readTime: 10,
    image: '/tutorials/covers/dealfinder-finetune.png',
  },
  {
    slug: 'dealfinder-agent',
    title: 'The agent that ties it together',
    series: 'DealFinder — AI Engineering',
    part: 11,
    excerpt:
      'A ReAct loop with text-to-SQL + deal-ranking tools and a human-in-the-loop gate answers a plain-English goal over the real catalog.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Agents', 'LangGraph', 'Python'],
    order: 21,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-agent.png',
  },
  {
    slug: 'dealfinder-mcp',
    title: 'Expose it as an MCP server',
    series: 'DealFinder — AI Engineering',
    part: 12,
    excerpt:
      'Wrap the catalog’s tools, a resource, and a prompt as an MCP server so any client (e.g. Claude Code) can search deals and score value.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'MCP', 'Python'],
    order: 22,
    readTime: 9,
    image: '/tutorials/covers/dealfinder-mcp.png',
  },
  {
    slug: 'dealfinder-pgvector',
    title: 'pgvector persistence + semantic search',
    series: 'DealFinder — AI Engineering',
    part: 13,
    excerpt:
      'Persist real deals to Postgres + pgvector with an HNSW cosine index, and search past listings by meaning — the same fastembed vectors from Part 5, now durable.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'pgvector', 'Postgres', 'Python'],
    order: 23,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-pgvector.png',
  },
  {
    slug: 'dealfinder-webapp',
    title: 'The web app',
    series: 'DealFinder — AI Engineering',
    part: 14,
    excerpt:
      'A real search UI over the live aggregator with a live/semantic toggle and DEAL/FAIR/SUSPICIOUS badges — served by FastAPI, XSS-hardened.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'FastAPI', 'Web', 'Python'],
    order: 24,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-webapp.png',
  },
  {
    slug: 'dealfinder-safety',
    title: 'Safety, security & governance',
    series: 'DealFinder — AI Engineering',
    part: 21,
    excerpt:
      'Defense in depth for the model surface: prompt-injection detection, PII redaction, output validation on the electronics schema, and a model card.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Safety', 'Security', 'Python'],
    order: 31,
    readTime: 10,
    image: '/tutorials/covers/dealfinder-safety.png',
  },
  {
    slug: 'dealfinder-eval',
    title: 'Prove it works — evaluation as a discipline',
    series: 'DealFinder — AI Engineering',
    part: 19,
    excerpt:
      'Golden sets, ranking metrics, LLM-as-judge and error analysis: the two-signal ranker scores precision@5 = 1.00 where median-only manages 0.40.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Evaluation', 'CI', 'Python'],
    order: 29,
    readTime: 9,
    image: '/tutorials/covers/dealfinder-eval.png',
  },
  {
    slug: 'dealfinder-serve',
    title: 'Serve it fast and cheap',
    series: 'DealFinder — AI Engineering',
    part: 22,
    excerpt:
      'The FastAPI service behind the aggregator: real routes, a semantic cache, and batching — the levers that cut latency and cost.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Serving', 'FastAPI', 'Python'],
    order: 32,
    readTime: 10,
    image: '/tutorials/covers/dealfinder-serve.png',
  },
  {
    slug: 'dealfinder-experiment-tracking',
    title: 'Experiment tracking & model registry',
    series: 'DealFinder — AI Engineering',
    part: 18,
    excerpt:
      'Track every price-model run with MLflow (local file store), compare linear vs GBDT vs PyTorch on one feature contract, and register the winner.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'MLOps', 'MLflow', 'Python'],
    order: 28,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-experiment-tracking.png',
  },
  {
    slug: 'dealfinder-mlops-loop',
    title: 'Closing the MLOps loop',
    series: 'DealFinder — AI Engineering',
    part: 20,
    excerpt:
      'Drift → retrain → eval-gate → champion/challenger promotion: the closed loop that keeps the deal model honest, built on real PSI and the eval gate.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'MLOps', 'Drift', 'Python'],
    order: 30,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-mlops-loop.png',
  },
  {
    slug: 'dealfinder-inference-optimization',
    title: 'Inference optimization, for real',
    series: 'DealFinder — AI Engineering',
    part: 23,
    excerpt:
      'What you can measure vs what needs a GPU: real semantic-cache hit rates, a cost-aware model cascade, and honestly-anchored quantization/vLLM references.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Inference', 'Serving', 'Python'],
    order: 33,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-inference-optimization.png',
  },
  {
    slug: 'dealfinder-deploy',
    title: 'Containerize and ship it',
    series: 'DealFinder — AI Engineering',
    part: 24,
    excerpt:
      'A real Docker image, a CI/CD pipeline with the eval gate, and one-command infra via Terraform/OpenTofu (db + app).',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Docker', 'CICD', 'Python'],
    order: 34,
    readTime: 9,
    image: '/tutorials/covers/dealfinder-deploy.png',
  },
  {
    slug: 'dealfinder-observability',
    title: 'Observability, cost & ops',
    series: 'DealFinder — AI Engineering',
    part: 26,
    excerpt:
      'Trace requests, attribute real API/LLM cost (FinOps), and watch for drift with PSI — the ops layer that keeps the deal engine honest.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Observability', 'FinOps', 'Python'],
    order: 36,
    readTime: 10,
    image: '/tutorials/covers/dealfinder-observability.png',
  },
  {
    slug: 'dealfinder-ship',
    title: 'Case study + system-design interview',
    series: 'DealFinder — AI Engineering',
    part: 33,
    excerpt:
      'Turn the whole DealFinder build into career capital: a metrics-driven case study, resume bullets that read as outcomes, and a mock AI system-design interview walked through on your own system.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Career', 'System Design'],
    order: 43,
    readTime: 11,
    image: '/tutorials/covers/dealfinder-ship.png',
  },
  {
    slug: 'dealfinder-dataset-engineering',
    title: 'Dataset engineering',
    series: 'DealFinder — AI Engineering',
    part: 15,
    excerpt:
      'Turn the frozen snapshot into a labeled, leakage-safe dataset: two-signal labels, grouped splits by query, and honest class-imbalance handling.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Machine Learning', 'Python'],
    order: 25,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-dataset-engineering.png',
  },
  {
    slug: 'dealfinder-ml-dl-breadth',
    title: 'ML & DL breadth',
    series: 'DealFinder — AI Engineering',
    part: 17,
    excerpt:
      'Beyond the linear baseline: gradient-boosted fair prices, a price-drop forecaster, and a real PyTorch training loop — with the honest MAE deltas.',
    date: '06-30-2026',
    tags: ['Tutorial', 'DealFinder', 'Machine Learning', 'Python'],
    order: 27,
    readTime: 12,
    image: '/tutorials/covers/dealfinder-ml-dl-breadth.png',
  },
];

/**
 * Fixed, canonical part count for a series — the "of N" total. Some series
 * (notably DealFinder) have a locked syllabus whose total is larger than the
 * number of built entries below; unbuilt parts have no manifest entry yet
 * (numbering gaps are expected during construction). For series without an
 * override, the total is derived from the number of entries (seriesTotal).
 */
export const SERIES_TOTAL_OVERRIDE: Record<string, number> = {
  'DealFinder — AI Engineering': 33,
};

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

/**
 * Total parts in a tutorial's series — the canonical override when set
 * (e.g. DealFinder = 33, a fixed syllabus with unbuilt parts), otherwise the
 * number of built entries.
 */
export function seriesTotal(series: string): number {
  return (
    SERIES_TOTAL_OVERRIDE[series] ??
    tutorials.filter((t) => t.series === series).length
  );
}

/** All parts of a series, in reading order. */
export function seriesParts(series: string): Tutorial[] {
  return tutorials.filter((t) => t.series === series).sort((a, b) => a.part - b.part);
}

/** Canonical display title: "Series: Subtitle (Part N of M)". */
export function fullTitle(t: Tutorial): string {
  return `${t.series}: ${t.title} (Part ${t.part} of ${seriesTotal(t.series)})`;
}
