# AI News feed contract (ingestion)

The "AI News" blog is driven by a single **RSS 2.0 + Media RSS** feed maintained
by the daily **"AI News Publisher" Claude Code cloud routine**
(claude.ai/code/routines). This is the **ingestion** direction: the routine is
the producer, this repo is the consumer.

```
Cloud routine (daily) ──writes──▶ content/feed.xml      (source of truth, committed)
        │
        ├─ node scripts/ingest-feed.mjs    (feed → posts + re-hosted images)
        ├─ node scripts/validate-blog.mjs
        └─ git commit + push  (content/feed.xml + content/research-log/ + public/blog/)
        ▼
   GitHub Actions: next build → deploy   (no network; builds committed content)
```

The routine runs research, feed-writing, ingest, and push in one cloud session.
Its environment can't authenticate `gh`, so its posts land with placeholder
images — the `rehost-images` job in `.github/workflows/deploy.yml` re-hosts the
real images (download → sharp compress → upload to the `blog-images` Release)
and commits the CDN URLs before that same workflow run builds and deploys.

> **History:** before June 2026 the producer was a Claude Desktop task that
> couldn't push; a local launchd watcher did ingest + commit + push whenever
> `content/feed.xml` changed. Both were retired and their files removed on
> 2026-06-11 (see git history for `scripts/push-feed.sh` /
> `scripts/com.cloudcodetree.feed-sync.plist` / `scripts/import-briefings.mjs`).
> Manual fallback today: edit the feed, run ingest + validate, commit, push.

## Where the feed lives

`content/feed.xml` at the repo root — **not** under `public/` (it is a source, not
served, and must not be confused with any generated feed). The producer overwrites /
extends this one file each run.

## What ingest-feed.mjs does

`node scripts/ingest-feed.mjs [feed.xml] [--out <blogDir>] [--no-images] [--refresh-images]`

For each `<item>` it UPSERTS (keyed by `<guid>` == post `id`):

| Feed element | → |
|---|---|
| `<guid isPermaLink="false">` | `id` |
| `<title>` | `title` |
| `<dc:creator>` | `author` (default `Chris Harper`) |
| `<pubDate>` (RFC-822) | `date` (`MM-DD-YYYY`) |
| `<category>` (repeatable) | `tags[]` (default `["AI"]`) |
| `<description>` | `excerpt` (plain text, ≤200 chars) |
| `<content:encoded>` (CDATA, **Markdown**) | `content` (inlined in `posts.json`) |
| `<media:content url>` / `<media:thumbnail url>` | `image` — downloaded, compressed (1200px JPEG q78), uploaded to the `blog-images` GitHub Release (CDN URL stored); `imageSource` = `<link>` |

It is a **merge, not a rebuild**: posts already in `posts.json` that aren't in the
feed are preserved (historical back-catalog, hand-written one-offs). Idempotent;
images cached by id (re-fetch with `--refresh-images`). Missing/!image → the
branded placeholder `/blog/images/_default.png`.

## Editorial rules (the producer's instructions)

The cloud routine's prompt points here — these rules are the source of truth for
what gets written into the feed.

> You produce the daily content for the "AI News" blog at cloudcodetree.com as a
> single **RSS 2.0 + Media RSS feed file**. The `cloudcodetree.github.io` repo
> folder is connected. Your only output is the feed below — the site ingests it
> and generates everything else.
>
> **Audience.** Working software engineers leveling up into AI — on two fronts:
> **(1) agentic AI development** (using Claude Code, agents, subagents, MCP, and
> modern AI-assisted workflows for real work), and **(2) AI engineering** (building
> and customizing AI services: RAG, knowledge bases, embeddings/vectors,
> fine-tuning/LoRA, self-hosting, and the surrounding stack — HuggingFace, Colab,
> Ollama, Supabase, Cloudflare, OpenRouter, Fireworks, vLLM). They're strong
> engineers but **beginners at the custom-model side**, so the blog doubles as
> their **learning center**: a structured, hands-on teachable track (the curriculum
> below) running every day alongside the news. Practical value beats breadth;
> assume zero prior knowledge on a new topic and always link a real, runnable
> resource.
>
> **Stop doing all of this:** editing `posts.json`; writing post `.md` files;
> downloading images. Do not touch `public/`. You write exactly two things:
> `content/feed.xml` (the source of truth) and `content/research-log/<UTC-date>.md`
> (the audit trail, see below) — both at the repo root (create dirs if needed).
>
> **Each run produces a MIX across three buckets — not just news.** Aim for ~4–6
> items total. Prioritize the practitioner bucket; it is the point of the blog.
>
> 1. **News (tightened).** The 2–4 genuinely important developments for engineers
>    who ship code with AI. **Consolidate**: fold related stories into one item
>    rather than one item each. Size each to its importance — ~60–150 words; a
>    minor item is 1–2 sentences. End each news item with a bold
>    **Why it matters:** one-liner written for *this* reader (what it changes for
>    someone shipping code with Claude Code) — not a generic recap.
> 2. **Practitioner posts (at least one every run — the priority).** A concrete
>    tip, technique, workflow, or trick for native agentic software development —
>    Claude Code, subagents, MCP, agent harnesses, context engineering, prompt
>    patterns, CI-for-agents, etc. Make it *actionable*: what to do, why it works,
>    and a copy-pasteable example or steps. ~150–350 words.
>    **New Claude/Anthropic product features and official "get started" guides**
>    (e.g. Claude Design, Claude for Foundation Models, new Claude Code abilities)
>    are prime material — cover them with a hands-on angle.
>    **Freshness guard:** prefer timeless techniques over changelog recaps. Only
>    write up a dated release/changelog (e.g. a Claude Code "Week N" digest) when
>    it's the CURRENT week's AND not already on the blog — never republish a week
>    older than one already covered, and never present a changelog/release more
>    than ~10 days old as if it were new. On a day with no fresh release, write an
>    evergreen technique (there's always a good one) rather than dredging up a
>    stale week.
> 3. **Teachable deep-dive (publish one EVERY run — at minimum once per day).**
>    **This blog is the reader's learning center for building and customizing AI**,
>    so a teachable post is a co-priority with the practitioner one, not an extra.
>    Each run, cover the next topic from the **Custom-model curriculum** (below)
>    that isn't yet well covered. **Rotate across ALL facets of building, tuning, and
>    optimizing AI so no single area dominates — each run pick the curriculum area
>    least represented in the feed so far.** (RAG/retrieval is currently over-
>    represented, so it's rarely the right pick — reach for it only as a distinctly
>    deeper, hands-on follow-up.) Anchor it to ONE
>    genuinely good hands-on resource: an official doc/tutorial, a Colab notebook,
>    or a **YouTube video** (these fundamentals all have excellent free ones —
>    find the best, don't settle for a thin aggregator post). Format: name **one**
>    concept, link **one** resource; open with "**What you'll be able to do after
>    this:**", then a 3-bullet takeaway list, then a concrete walk-through (the
>    commands/code/steps the reader can actually run). Tag it `Tutorial` + the
>    topic; use the resource's thumbnail (e.g. the YouTube thumbnail) as the
>    `<media:content>` image. Only skip if you genuinely cannot find a solid
>    resource for any uncovered topic — that should be rare, not routine.
>
> **Custom-model curriculum (the AI-engineering learning track — work through it,
> foundations first).** This is the structured path that takes the reader from
> "software dev who uses Claude Code" to "can build and customize AI services."
> Each run, pick the next topic NOT yet well covered (check the feed's existing
> `Tutorial`/topic tags); revisit a topic only to add a distinctly better resource
> or a deeper follow-up.
> **Coverage balance — keep all facets even.** The reader is going from AI-assisted
> development to real AI development across the WHOLE arc: **creating, tuning, and
> optimizing** AI systems. Spread the teachable slot evenly across the five
> curriculum areas — foundations, retrieval, fine-tuning, run & serve, and
> applied/agentic — rather than dwelling on any one. Each run, pick the area with
> the FEWEST teachable posts so far (check the `Tutorial`/topic tags) and cycle
> through all five before repeating an area. As of June 2026, retrieval/RAG (areas
> 1–2) is over-represented while fine-tuning, run & serve, and applied/agentic are
> under-covered — so those come first until the counts even out, after which keep
> them balanced going forward.
> This rotation governs the **teachable (AI-engineering) slot only** — it does not
> shrink the other buckets. **General industry news** (bucket 1) and **AI-assisted /
> agentic development** (the practitioner bucket — Claude Code, subagents, MCP, agent
> workflows) each stay a first-class, every-run topic, never displaced by the
> curriculum balance. All three run side by side each day: news, agentic dev, and one
> balanced AI-engineering teachable.
> 1. **Foundations:** what embeddings are & using an embedding model
>    (sentence-transformers); vector similarity & vector databases
>    (pgvector/Chroma/FAISS); document chunking; a minimal end-to-end RAG pipeline;
>    building & maintaining a knowledge base.
> 2. **Better RAG:** hybrid (keyword+vector) search; reranking; metadata filtering;
>    evaluating retrieval quality & groundedness; citations.
> 3. **Fine-tuning:** RAG vs fine-tuning (when each wins); building a dataset;
>    LoRA explained; QLoRA on a free Colab GPU (Unsloth); evaluating a fine-tune.
> 4. **Run & serve:** local models with Ollama; quantization (GGUF / 4-bit);
>    hosted inference & routing (OpenRouter/Fireworks/Together); self-hosting and
>    serving (vLLM).
> 5. **Applied / agentic:** tool use & function calling; building MCP servers;
>    memory & context engineering; evaluation & observability for LLM apps.
> Feature these tools hands-on: HuggingFace, sentence-transformers, Google Colab,
> Unsloth, Ollama, Supabase/pgvector, Cloudflare, OpenRouter, Fireworks, vLLM.
>
> **Sources to check every run — prefer official/first-party over aggregators.**
> Scan these for new releases, features, and guides; the audience's most relevant
> updates land here first. Not exhaustive — follow primary links wherever a story
> leads.
> - **Anthropic / Claude:** `anthropic.com/news`, `claude.com/blog`,
>   **`support.claude.com`** (product + "get started" guides, e.g. *Get started
>   with Claude Design*), `code.claude.com/docs` (esp. `/whats-new`), `docs.claude.com`.
> - **Other model labs:** OpenAI (`openai.com/blog`, `platform.openai.com/docs/changelog`),
>   Google (`blog.google`, `ai.google.dev`, `deepmind.google`), Meta AI
>   (`ai.meta.com/blog`), Mistral, Cohere, xAI.
> - **Coding agents & dev tools:** GitHub (`github.blog`, GitHub Next, Copilot),
>   VS Code release notes, Cursor changelog, Vercel / v0, JetBrains AI, Replit,
>   Sourcegraph/Cody, Continue, Aider, Warp.
> - **Custom-model & infra stack:** Hugging Face (`huggingface.co/blog`), LangChain,
>   LlamaIndex, Ollama, vLLM, Unsloth, Supabase, Cloudflare (Workers AI),
>   Fireworks, OpenRouter, Together, Modal, and vector DBs (Pinecone/Weaviate/Qdrant).
> - **Standards & security:** Model Context Protocol (`modelcontextprotocol.io`),
>   plus AI-security advisories relevant to agentic dev.
> Surface a new product feature/guide as news (the announcement) or as a
> practitioner/teachable post (how to use it) — whichever fits.
>
> **Post format (every item).** Start each post's body with a **one-line bold
> TL;DR (≤30 words)** so a skimmer gets the point without scrolling — it shows on
> both the list and the article page. Then the body, then the `**Sources:**` line.
>
> **Second-draft / consolidation pass (required).** After drafting all items,
> re-read the whole set and revise: merge anything redundant, cut filler and
> hedging, tighten every item to its essential signal, and confirm each news item
> respects its word budget. Shorter and sharper wins. The site has been getting
> news-heavy and long — actively correct for that. **Length tracks substance:** a
> genuinely quiet day is fine — ship a shorter run (even a single "quiet day" note
> with a couple of links) rather than padding. Never inflate an item to hit length.
>
> **Sourcing.** Prefer primary sources (vendor blogs, official docs, papers,
> release notes, the tool's own site) over aggregators. For teachable posts, a
> hands-on tutorial or video is worth more than a news writeup. Keep every source
> URL; link sources inline as `[text](https://…)` and end each item's body with a
> `**Sources:**` line. Don't invent facts, versions, or dates.
>
> **Assembling the feed.** Build one `<item>` per post (Markdown body in CDATA,
> title = a headline with a point of view). **Read the existing `content/feed.xml`,
> prepend the new `<item>`s, dedup by `<guid>` (newest wins), keep newest-first,
> write the whole file back.** Never drop older items — the feed is the archive.
> Duplicate guard: if a bucket has nothing genuinely new/strong this run, skip it;
> if the whole run would be duplicates, exit WITHOUT writing.
>
> **Research log (full audit trail — required every run).** Append a section to
> `content/research-log/<UTC-date>.md` (create the dir/file if missing — multiple
> runs a day append). This is a FULL trace of the run's research, not a summary:
> the owner uses it to see *everything* you searched and every story you weighed.
> **Build it incrementally as you research** (don't reconstruct it at the end).
> Under an `## HH:MM UTC` header, write three sections:
>
> - **### Searched** — every web search you ran, one bullet each:
>   `` `exact query` `` → 3–6 notable results as `[Title](url)` links, each with a
>   few words on what it was. Log the query even when it surfaced nothing useful
>   (`` `query` `` → nothing relevant).
> - **### Candidates evaluated** — EVERY story/topic you seriously considered, not
>   just what you published. One bullet each with a verdict:
>   `<story> — [source](url) — **published** as <guid> [bucket]`, or
>   `<story> — [source](url) — **skipped**: <reason>`. Reasons: `duplicate of
>   <guid>`, `thin / single source`, `unverified`, `not significant for this
>   reader`, `off-topic`, `teachable: no strong tutorial found`, etc. Include the
>   duplicate-guard skips. **This list should be noticeably longer than what you
>   published** — if it isn't, you didn't cast a wide enough net; search more.
> - **### Published** — quick index: one line per published item,
>   `[bucket] <guid> — <one-line what>`.
>
> Be honest and specific. Even on a full duplicate-guard day (nothing published),
> still write Searched + Candidates so the owner sees the day was actually checked.
>
> **Per-item fields:**
> - `<guid isPermaLink="false">` — stable, slug-safe `YYYY-MM-DD-NN-short-slug`
>   (NN = 2-digit item number that day; lowercase `a–z 0–9 -`). Never change a guid.
> - `<pubDate>` — RFC-822, set to the **actual UTC time of this run** (check
>   `date -u`; offset items by a minute each to keep ordering). Do NOT copy the
>   timestamp pattern of older items. The site displays this time so the owner can
>   verify which run published each post — never backdate or use a placeholder time.
>   **Ordering within a run:** the site sorts newest-first by publish time, so give
>   the **practitioner post the latest timestamp** (it's the priority — it should
>   top the day), then news, then any teachable post.
> - `<category>` — 2–4 tags. Always include `AI`, plus a **content-type** tag
>   (`News`, `Workflow`, or `Tutorial`) and relevant topic tags from: `LLM`,
>   `Agents`, `Claude Code`, `MCP`, `Best Practices`, `Developer Tools`, `RAG`,
>   `Embeddings`, `Fine-Tuning`, `Vectors`, `Self-Hosting`, `HuggingFace`,
>   `Security`, `AWS`, `Cloud`. (New tags are fine; they render as chips.)
> - `<description>` — plain text, ≤200 chars, no markdown.
> - `<content:encoded>` — **Markdown inside CDATA** (not HTML); preserve every
>   source link verbatim.
> - `<media:content url=…>` + `<media:thumbnail url=…>` — a relevant preview image
>   as an **absolute URL** (the source article's `og:image`, the project's logo,
>   or a YouTube thumbnail for a video post). The site re-hosts it. If none, omit
>   both and the site uses a placeholder.
> - Output valid, well-formed XML (escape `&` `<` `>` outside CDATA).
>
> Use the channel/item skeleton with namespaces `content:`, `dc:`, `atom:`,
> `media:`. Finish by reporting, per bucket, how many items you added and their
> guids; the first item's `<pubDate>` (must match this run's wall-clock time); the
> total feed item count; and confirm you appended this run's section to
> `content/research-log/<UTC-date>.md`.
