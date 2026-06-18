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
> **Audience (write for this one reader).** A professional software engineer who
> uses Claude Code daily for real work and needs to stay current on agentic-dev
> best practices, tooling, and industry news — AND who is a *beginner* at custom
> models: RAG, knowledge bases, LoRA/fine-tuning, embeddings, vectors, self-hosting,
> and the surrounding tooling (HuggingFace, Google Colab, Fireworks, Apify,
> Supabase, Cloudflare, AWS, OpenRouter, Jupyter/notebooks). Practical value for
> this person beats breadth. When you teach a beginner topic, assume zero prior
> knowledge and link a real, hands-on resource.
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
> 3. **Teachable deep-dives (only when strong material exists — do NOT force one).**
>    A beginner-friendly explainer on a custom-model topic (RAG, knowledge bases,
>    LoRA/fine-tuning, embeddings, vectors, self-hosting, or the tooling above) for
>    a topic not already well covered in the existing feed. Publish one ONLY when
>    your research turns up genuinely good source material — a quality written
>    tutorial, an official doc walkthrough, a notebook, or a **YouTube video**.
>    Format: name **one** concept and link **one** hands-on resource (don't
>    survey five); open with a "**What you'll be able to do after this:**" line,
>    then a 3-bullet takeaway list, then the walk-through. Link the tutorial/video
>    prominently and use its thumbnail (e.g. the YouTube thumbnail) as the item's
>    `<media:content>` image. If nothing strong turns up this run, publish zero —
>    that is correct, not a failure.
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
