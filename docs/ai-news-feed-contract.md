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
        └─ git commit + push  (content/feed.xml + public/blog/)
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
> **Stop doing all of this:** editing `posts.json`; writing `.md` files;
> downloading images; running scripts; committing/pushing. Do not touch `public/`.
> Your only write is `content/feed.xml` at the repo root (create `content/` if
> needed). It is the source of truth.
>
> **Each run produces a MIX across three buckets — not just news.** Aim for ~4–6
> items total. Prioritize the practitioner bucket; it is the point of the blog.
>
> 1. **News (tightened).** The 2–4 genuinely important developments for engineers
>    who ship code with AI. **Consolidate**: fold related stories into one item
>    rather than one item each. Keep each to ~100–220 words.
> 2. **Practitioner posts (at least one every run — the priority).** A concrete
>    tip, technique, workflow, or trick for native agentic software development —
>    Claude Code, subagents, MCP, agent harnesses, context engineering, prompt
>    patterns, CI-for-agents, etc. Make it *actionable*: what to do, why it works,
>    and a copy-pasteable example or steps. ~150–350 words.
> 3. **Teachable deep-dives (only when strong material exists — do NOT force one).**
>    A beginner-friendly explainer on a custom-model topic (RAG, knowledge bases,
>    LoRA/fine-tuning, embeddings, vectors, self-hosting, or the tooling above) for
>    a topic not already well covered in the existing feed. Publish one ONLY when
>    your research turns up genuinely good source material — a quality written
>    tutorial, an official doc walkthrough, a notebook, or a **YouTube video**.
>    Lead the reader from "what is this / why care" to a hands-on next step, and
>    link the tutorial/video prominently. If nothing strong turns up this run,
>    publish zero — that is correct, not a failure.
>
> **Second-draft / consolidation pass (required).** After drafting all items,
> re-read the whole set and revise: merge anything redundant, cut filler and
> hedging, tighten every item to its essential signal, and confirm each news item
> respects its word budget. Shorter and sharper wins. The site has been getting
> news-heavy and long — actively correct for that.
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
> **Per-item fields:**
> - `<guid isPermaLink="false">` — stable, slug-safe `YYYY-MM-DD-NN-short-slug`
>   (NN = 2-digit item number that day; lowercase `a–z 0–9 -`). Never change a guid.
> - `<pubDate>` — RFC-822, set to the **actual UTC time of this run** (check
>   `date -u`; offset items by a minute each to keep ordering). Do NOT copy the
>   timestamp pattern of older items. The site displays this time so the owner can
>   verify which run published each post — never backdate or use a placeholder time.
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
> guids; the first item's `<pubDate>` (must match this run's wall-clock time); and
> the total feed item count.
