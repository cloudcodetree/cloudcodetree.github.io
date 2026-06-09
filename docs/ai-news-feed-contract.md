# AI News feed contract (ingestion)

The "AI News" blog is driven by a single **RSS 2.0 + Media RSS** feed that the
Claude Desktop "AI Developer News" task maintains. This is the **ingestion**
direction: the task is the producer, this repo is the consumer.

```
Claude Desktop task ──writes──▶ content/feed.xml        (source of truth, committed)
        │
   launchd WatchPaths ─fires─▶ scripts/push-feed.sh
        │                         ├─ node scripts/ingest-feed.mjs   (feed → posts)
        │                         ├─ node scripts/validate-blog.mjs
        │                         └─ git commit + push  (content/feed.xml + public/blog/)
        ▼
   GitHub Actions: next build → deploy   (no network; builds committed content)
```

The task **cannot push**, so a local launchd agent does it. Ingestion + image
re-hosting run **locally** (once per image) and the results are committed, so CI
stays a deterministic, network-free `next build`.

## Where the feed lives

`content/feed.xml` at the repo root — **not** under `public/` (it is a source, not
served, and must not be confused with any generated feed). The task overwrites /
extends this one file each run.

## What ingest-feed.mjs does

`node scripts/ingest-feed.mjs [feed.xml] [--out <blogDir>] [--no-images] [--refresh-images]`

For each `<item>` it UPSERTS (keyed by `<guid>` == post `id`):

| Feed element | → |
|---|---|
| `<guid isPermaLink="false">` | `id` + filename stem (`<id>.md`) |
| `<title>` | `title` |
| `<dc:creator>` | `author` (default `Chris Harper`) |
| `<pubDate>` (RFC-822) | `date` (`MM-DD-YYYY`) |
| `<category>` (repeatable) | `tags[]` (default `["AI"]`) |
| `<description>` | `excerpt` (plain text, ≤200 chars) |
| `<content:encoded>` (CDATA, **Markdown**) | `public/blog/<id>.md` body |
| `<media:content url>` / `<media:thumbnail url>` | `image` — downloaded to `public/blog/images/<id>.<ext>`; `imageSource` = `<link>` |

It is a **merge, not a rebuild**: posts already in `posts.json` that aren't in the
feed are preserved (historical back-catalog, hand-written one-offs). Idempotent;
images cached by id (re-fetch with `--refresh-images`). Missing/!image → the
branded placeholder `/blog/images/_default.png`.

## The task prompt

Paste this as the Claude Desktop task instructions (repo folder connected):

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
