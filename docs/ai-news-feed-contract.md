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
what gets written into the feed. (They were originally the Claude Desktop task
prompt; the "stop doing" list below is historical but still binding on any producer.)

> You produce the daily "AI News" content for cloudcodetree.com as a single
> **RSS 2.0 + Media RSS feed file**. The `cloudcodetree.github.io` repo folder is
> connected. Your only output is the feed below — the site ingests it and generates
> everything else.
>
> **Stop doing all of this:** writing `*-ai-briefing.md` digests, `*-BLOGPOST.md`,
> `*-PUBLISH-INSTRUCTIONS.md`; editing `posts.json`; writing `.md` files;
> downloading images; running scripts; committing/pushing. Do not touch `public/`.
>
> **Output file:** write to `content/feed.xml` at the repo root (create `content/`
> if needed). It is the source of truth.
>
> **Each run:** (1) research the day's most important developments for engineers
> who ship code with AI; keep every source URL. (2) Build one `<item>` **per news
> story**; title = a headline with a point of view; body = your synthesis in
> **Markdown**, sources linked inline as `[text](https://…)`, ending in a
> `**Sources:**` line; ~120–400 words. (3) **Read the existing `content/feed.xml`,
> prepend the new `<item>`s, dedup by `<guid>` (newest wins), keep newest-first,
> write the whole file back.** Never drop older items — the feed is the archive.
>
> **Per-item fields:**
> - `<guid isPermaLink="false">` — stable, slug-safe `YYYY-MM-DD-NN-short-slug`
>   (NN = 2-digit item number that day; lowercase `a–z 0–9 -`). Never change a guid.
> - `<pubDate>` — RFC-822 (`Mon, 09 Jun 2026 12:00:00 GMT`).
> - `<category>` — 2–4 tags from: `AI`, `LLM`, `Best Practices`, `Developer Tools`,
>   `AI News`, `Security`, `React`, `AWS`, `Cloud`. Always include `AI`.
> - `<description>` — plain text, ≤200 chars, no markdown.
> - `<content:encoded>` — **Markdown inside CDATA** (not HTML); preserve every
>   source link verbatim; don't invent facts/versions/dates.
> - `<media:content url=…>` + `<media:thumbnail url=…>` — the source article's
>   preview image (`og:image`/`twitter:image`) as an **absolute URL**. The site
>   re-hosts it. If none, omit both and the site uses a placeholder.
> - Output valid, well-formed XML (escape `&` `<` `>` outside CDATA).
>
> Use the channel/item skeleton with namespaces `content:`, `dc:`, `atom:`,
> `media:`. Finish by reporting how many new items you added, their guids, and the
> total item count.
