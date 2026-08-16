# AI News feed contract (ingestion)

The "AI News" blog is driven by a single **RSS 2.0 + Media RSS** feed maintained
by the **"AI News Publisher" Claude Code cloud routine**
(claude.ai/code/routines), which runs **three times a day (≈04:00, 12:00, 20:00
UTC)**. This is the **ingestion** direction: the routine is the producer, this
repo is the consumer.

> **Each run is a separate session with no memory of the other two.** The
> committed `content/feed.xml` is the only shared state between them, which is why
> the editorial rules below are written in terms of a **per-day** budget the run
> must derive by reading the feed — a per-run rule alone silently triples.

```
Cloud routine (3×/day) ─writes──▶ content/feed.xml      (rolling ~120-item window)
        │
        ├─ node scripts/ingest-feed.mjs    (feed → posts + re-hosted images)
        ├─ node scripts/trim-feed.mjs      (drop ingested items past the window)
        ├─ node scripts/validate-blog.mjs
        └─ git commit + push  (content/feed.xml + content/research-log/ + public/blog/)
        ▼
   GitHub Actions: next build → deploy   (no network; builds committed content)

   public/blog/posts.json = the ARCHIVE (every post ever, committed)
   content/feed.xml       = the recent window the routine dedups against
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

`node scripts/ingest-feed.mjs [feed.xml] [--no-images] [--refresh-images]`

> There is no `--out` flag (an older version of this doc claimed one). Ingest always
> merges into `public/blog/posts.json` in place — there is no dry-run target, so
> treat every invocation as a write to the real blog data.

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
> **Audience.** Working software engineers leveling up into AI — on three fronts:
> **(1) agentic AI development** (using Claude Code, agents, subagents, MCP, and
> modern AI-assisted workflows for real work), **(2) AI engineering** (building
> and customizing AI services: RAG, knowledge bases, embeddings/vectors,
> fine-tuning/LoRA, self-hosting, and the surrounding stack — HuggingFace, Colab,
> Ollama, Supabase, Cloudflare, OpenRouter, Fireworks, vLLM), and **(3) AI-native
> design & design-to-code** (Claude Design, Magic Patterns, v0, Figma Make and
> friends — generating real UI with agents and landing it in a real codebase).
> They're strong engineers but **beginners at the custom-model side**, so the blog
> doubles as their **learning center**: a structured, hands-on teachable track (the
> curriculum below) running every day alongside the news. Practical value beats
> breadth; assume zero prior knowledge on a new topic and always link a real,
> runnable resource.
>
> **Two readers for the design front, cover both.** (a) The *engineer* who wants
> generated UI to survive contact with a real repo — how Claude Design output gets
> into a Next.js/React codebase, how it coexists with an existing design system,
> and how it hands off to Claude Code for iteration. This reader is primary. (b) The
> *product/design person* starting from zero, who needs the vocabulary and the first
> hour to make sense. Write so a designer isn't lost and an engineer isn't bored:
> lead with the concrete task, keep the codebase details in the walk-through where
> a non-engineer can skim past them.
>
> **Stop doing all of this:** editing `posts.json`; writing post `.md` files;
> downloading images. Do not touch `public/`. You write exactly two things:
> `content/feed.xml` (the source of truth) and `content/research-log/<UTC-date>.md`
> (the audit trail, see below) — both at the repo root (create dirs if needed).
>
> **You are one of THREE runs per day (≈04:00, 12:00, 20:00 UTC).** This is the
> single most important thing to internalize about volume: the reader sees the
> *day's* output, not your run's. Budget accordingly.
> - **Per run: 2–4 items.** Never more than 4.
> - **Per day: 8 items. This is a TARGET, not headroom to spend.** Before writing,
>   count the items in `content/feed.xml` carrying today's UTC date. Then:
>   **the number you may publish is `8 − (items already published today)`.**
>   Compute that number explicitly and state it in your report. If it is 0 or
>   negative, publish nothing unless a story is genuinely important.
> - **10 is a hard ceiling, not a goal.** It exists for an exceptional news day —
>   a major release, a security incident — where an extra item or two is
>   genuinely warranted. Landing on 10 as a matter of routine means the rule was
>   read backwards. Do not treat the gap between 8 and 10 as budget available to
>   you: if your last candidate is only justified by "we're still under 10",
>   that is exactly the item to cut.
> - **Exiting without writing is a valid, good outcome.** So is publishing one
>   item. A quiet day should look quiet.
> - The other two runs cannot see your draft, only what you commit. So the feed is
>   the only coordination mechanism: read it first, every time.
>
> **Each run produces a MIX across four buckets — not just news.** Prioritize the
> practitioner and design buckets; they are the point of the blog. You are not
> required to hit every bucket every run — across the day all four should appear,
> and it is better to skip a bucket than to pad it.
>
> 1. **News (tightened).** The 1–3 genuinely important developments for engineers
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
> 3. **Teachable deep-dive (at least one per DAY — not required every run).**
>    **This blog is the reader's learning center for building and customizing AI**,
>    so a teachable post is a co-priority with the practitioner one, not an extra.
>    Check the feed for today's UTC date: if no teachable has gone out yet today,
>    write one; if one has, only add another when it's a genuinely different area.
>    Cover the next topic from the **Custom-model curriculum** (below)
>    that isn't yet well covered. **Rotate across ALL facets of building, tuning, and
>    optimizing AI so no single area dominates — pick the curriculum area
>    least represented in the feed so far**, counting the topic tags actually
>    present rather than assuming any area is ahead or behind. Anchor it to ONE
>    genuinely good hands-on resource: an official doc/tutorial, a Colab notebook,
>    or a **YouTube video** (these fundamentals all have excellent free ones —
>    find the best, don't settle for a thin aggregator post). Format: name **one**
>    concept, link **one** resource; open with "**What you'll be able to do after
>    this:**", then a 3-bullet takeaway list, then a concrete walk-through (the
>    commands/code/steps the reader can actually run). Tag it `Tutorial` + the
>    topic; use the resource's thumbnail (e.g. the YouTube thumbnail) as the
>    `<media:content>` image. Only skip if you genuinely cannot find a solid
>    resource for any uncovered topic — that should be rare, not routine.
> 4. **Design & design-to-code (RAMP-UP: one every run until the base is built).**
>    AI design tools and how they fit a real shipping workflow: **Claude Design**
>    first, plus Magic Patterns, v0, Figma Make, Lovable, Framer AI. The reader is
>    adopting these right now and struggling with *how to work with them*, not with
>    what they are — so hands-on beats announcement every time. Good angles:
>    - Getting generated UI out of the tool and into a real repo (Next.js/React,
>      an existing component library, an existing design system).
>    - The **handoff to Claude Code**: what to regenerate in the design tool vs.
>      what to iterate on in the editor, and how to keep the two from fighting.
>    - Prompting a design tool well — what it responds to, where it goes wrong.
>    - Design tokens, specs, and system docs an agent can actually consume.
>    - Reviewing and correcting AI-generated UI; accessibility and responsive
>      behavior in generated components; when to regenerate vs. hand-edit.
>    Format like a practitioner post (~150–350 words, concrete steps, real
>    screenshots/links where they help). Tag it `Design` plus the tool's tag.
>
>    **Serve BOTH readers — this is a quota, not a suggestion.** Every angle above
>    is written for reader (a), the engineer. Left to itself this bucket will pick
>    an engineer angle every single time, because that's where the concrete detail
>    is. So: **at least one in every three design posts must be written for reader
>    (b) — the product/design person starting from zero.**
>
>    **How to decide, in order — this is mechanical, do not improvise:**
>    1. List the `Design`-tagged posts in `posts.json`, newest first.
>    2. **Zero exist** → write reader **(a)**. The engineer angle establishes the
>       workflow that a reader-(b) post can then point back at.
>    3. **Exactly one exists** → write **the opposite reader** from that one. (Do
>       not wait for a third post to start balancing; during ramp-up the archive is
>       small and one lopsided pair sets the pattern for months.)
>    4. **Two or more exist** → look at the newest two. If BOTH are reader (a),
>       this one MUST be reader (b). Otherwise either is allowed, but prefer (b)
>       whenever the last (b) post is more than three design posts back.
>
>    **How to tell which reader an existing post targeted** — judge the post, not
>    your memory of it: if it opens with a repo, a package name, a CLI command, or
>    a framework, it is reader (a). If it opens at a URL or in the product UI with
>    no build step, it is reader (b). (The run report also records this, but the
>    post itself is the authority.)
>
>    State which reader you wrote for in your run report (`design reader:
>    (a) engineer` or `(b) design/PM`), along with what the previous posts targeted
>    and which rule above applied.
>    A reader-(b) post assumes no repo, no component library, and no build step:
>    the genuine first hour, what the tool can and can't do, the vocabulary an
>    engineer will use back at you, and how to hand work off without reading code.
>    Do not simply retitle an engineer post — if it opens with a repo or a package
>    name, it is not a reader-(b) post.
>    **Ramp-up and exit — check this yourself, don't guess.** Count feed items
>    tagged `Design`. While that count is **under 12**, this bucket runs **once
>    every run** and takes priority over the teachable slot when the run is tight.
>    Once it reaches 12, this bucket **retires**: design stops being a standalone
>    bucket and becomes **curriculum area 6**, picked up by the normal
>    least-covered-area rotation like everything else. Say which mode you're in
>    (`ramp-up, N/12` or `steady`) in your end-of-run report.
>    **Same anti-padding rule as everywhere else:** if there's no fresh design
>    story and no evergreen how-to worth writing, skip the bucket. A thin design
>    post is worse than none.
>
> **Custom-model curriculum (the AI-engineering learning track — work through it,
> foundations first).** This is the structured path that takes the reader from
> "software dev who uses Claude Code" to "can build and customize AI services."
> Each run, pick the next topic NOT yet well covered (check the feed's existing
> `Tutorial`/topic tags); revisit a topic only to add a distinctly better resource
> or a deeper follow-up.
> **Coverage balance — keep all facets even.** The reader is going from AI-assisted
> development to real AI development across the WHOLE arc: **creating, tuning, and
> optimizing** AI systems. Spread the teachable slot evenly across the six
> curriculum areas — foundations, retrieval, fine-tuning, run & serve,
> applied/agentic, and agentic design — rather than dwelling on any one.
> **Derive the balance from the feed, never from memory or from this document:**
> count the teachable posts per area, pick the area with the FEWEST, and cycle
> through all six before repeating an area. Do not carry forward any hard-coded
> claim about which area is ahead or behind — those go stale, and a stale claim
> will steer you wrong for months. The counts in the feed are the only authority.
>
> **How to count — do NOT map areas to tag sets.** Several tags belong to more
> than one area (`RAG` fits both Foundations and Better RAG; `Agents` fits both
> Applied/agentic and others), so intersecting tag sets produces phantom empty
> areas. A run has already been misled this way: it mapped `RAG` into Foundations,
> concluded "Better RAG: 0 tutorials", and picked Better RAG as least-covered on
> an artifact rather than a fact.
> Instead: **attribute each `Tutorial` post to exactly ONE area by its actual
> subject** — read the title, not just the tags — and count those. A post about a
> minimal end-to-end RAG pipeline is Foundations; one about reranking or hybrid
> search is Better RAG, even though both carry `RAG`. When a post genuinely spans
> two areas, count it for the EARLIER one. Show the per-area counts in your report
> so the attribution is visible and can be challenged.
> This rotation governs the **teachable (AI-engineering) slot only** — it does not
> shrink the other buckets. **General industry news** (bucket 1) and **AI-assisted /
> agentic development** (the practitioner bucket — Claude Code, subagents, MCP, agent
> workflows) each stay a first-class, every-run topic, never displaced by the
> curriculum balance. All four run side by side each day: news, agentic dev, one
> balanced AI-engineering teachable, and design/design-to-code.
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
> 6. **Agentic design & design-to-code:** what AI design tools actually generate
>    (and what they don't); Claude Design end-to-end on a real project; landing
>    generated UI in an existing codebase without wrecking the design system;
>    the design-tool → Claude Code handoff loop; design tokens/specs an agent can
>    consume; reviewing and correcting AI-generated UI; accessibility and
>    responsive behavior in generated components; when to regenerate vs. hand-edit.
> Feature these tools hands-on: HuggingFace, sentence-transformers, Google Colab,
> Unsloth, Ollama, Supabase/pgvector, Cloudflare, OpenRouter, Fireworks, vLLM,
> Claude Design, Magic Patterns, v0, Figma Make.
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
> - **AI design & design-to-code (check every run during ramp-up):** Claude Design
>   (`support.claude.com` guides + `claude.com/blog`), Magic Patterns
>   (`magicpatterns.com` blog/changelog), v0 (`v0.dev`, Vercel changelog), Figma
>   (`figma.com/blog` — Make, Dev Mode, Code Connect), Lovable, Framer AI, plus
>   design-system-meets-AI writing from practitioners actually shipping with these.
>   For this bucket a good hands-on walk-through outranks a product announcement.
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
> write the whole file back.**
> Duplicate guard: if a bucket has nothing genuinely new/strong this run, skip it;
> if the whole run would be duplicates, exit WITHOUT writing.
>
> **The feed is a rolling window, NOT the archive.** `public/blog/posts.json` is the
> archive — `ingest-feed.mjs` merges rather than rebuilds, so a post stays on the
> site forever once ingested, whether or not it is still in the feed. The feed
> carries only enough recent history for you to dedup against (~120 items / two
> weeks), because you are asked to READ it every run and an unbounded file stops
> fitting in your context — which silently breaks the dedup guard.
> **Never trim by hand.** After ingest, run `node scripts/trim-feed.mjs`; it drops
> only items already present in `posts.json`, so a post you just wrote can never be
> lost, and every trimmed item remains in git history. If you skip it, nothing breaks
> today — `validate-blog.mjs` starts warning once the feed passes 1.5× the window,
> and that warning means your dedup context is silently degrading.
>
> **Your dedup window is ~15 days.** For anything older, do not assume the feed
> tells you whether a story ran — it won't. Check `public/blog/posts.json` (search
> it for the topic) before writing up something that may already be covered. This
> matters most for evergreen technique posts, which are the easiest to repeat.
>
> **QUERY the feed; do not read it whole.** At ~437 KB it exceeds the Read tool's
> 256 KB limit, and reading it whole would burn most of your context for no gain.
> This is expected — it is sized for dedup coverage, not for one read. Use
> targeted queries instead, e.g.:
> ```bash
> grep -c "<item>" content/feed.xml                       # how many items
> grep "<guid" content/feed.xml | head -20                # today's item numbers
> grep -c "<category>Design</category>" content/feed.xml  # design ramp-up count
> grep -i "reranking\|hybrid search" content/feed.xml     # already covered?
> ```
> A Python `xml.etree` one-liner works well for anything structured (per-item
> tags, dates, per-area counts). Reserve `Read` for the head of the file when you
> need the channel/item skeleton, via `limit`.
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
>   **Ordering within a run:** the site sorts newest-first by publish time. While
>   the design bucket is in **ramp-up**, give the **design post the latest
>   timestamp** (it tops the day), then the practitioner post, then news, then any
>   teachable post. Once design ramps down to steady, the **practitioner post**
>   takes the latest timestamp again.
> - `<category>` — 2–4 tags. **The tag vocabulary is enforced by
>   `scripts/validate-blog.mjs`; a violation fails the build.** Every item MUST have:
>   - `AI` — always.
>   - exactly one **content-type** tag: `News`, `Workflow`, or `Tutorial`.
>     Not optional. (`Workflow` covers practitioner + design how-tos.)
>   - 1–2 **topic** tags from: `LLM`, `Agents`, `Claude Code`, `MCP`,
>     `Best Practices`, `Developer Tools`, `RAG`, `Embeddings`, `Fine-Tuning`,
>     `Vectors`, `Self-Hosting`, `HuggingFace`, `Security`, `AWS`, `Cloud`,
>     `Design`, `Claude Design`, `Design-to-Code`, `UI/UX`.
>   **Never use `AI News` as a tag** — it is a duplicate of `News` and splits the
>   site's topic filter into two chips for one topic. Use `News`.
>   Design-bucket items must carry `Design` (that tag is what the ramp-up counter
>   counts), plus `Claude Design` when the post is specifically about that tool.
>   **Prefer an existing tag over a new synonym.** `Vector Search` when `Vectors`
>   exists, or `Models` when `LLM` exists, gives the site's topic filter two chips
>   for one topic. A genuinely new subject may get a new tag — but then add it to
>   this list AND to `TOPIC_TAGS` in `scripts/validate-blog.mjs` in the same commit.
>   **What the validator does:** a retired tag (`AI News`) or a missing content-type
>   is a hard **error** and fails the build; an unrecognized tag is a **warning** —
>   it won't block you, but leaving it unreconciled is how the filter fragments.
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
> `content/research-log/<UTC-date>.md`. Also report:
> - **Today's item count across all runs** (items in the feed with today's UTC
>   date, including yours) against the ~8/day budget and 10 ceiling.
> - **Design bucket mode** — `ramp-up, N/12` or `steady` — with N being the live
>   count of feed items tagged `Design`; plus, for any design post you wrote,
>   **which reader it targets** (`(a) engineer` or `(b) design/PM`) and what the
>   previous two design posts targeted, so the one-in-three quota is auditable.
>
> **Before you finish, run these in order** — do not commit if either fails:
> ```bash
> node scripts/ingest-feed.mjs      # feed → posts.json (a merge; never loses posts)
> node scripts/trim-feed.mjs        # keep the feed to its rolling window
> node scripts/validate-blog.mjs    # schema + tag vocabulary
> node scripts/validate-research-log.mjs
> ```
> Trim AFTER ingest, never before: it only drops items already captured in
> `posts.json`, so that order is what guarantees this run's posts survive.
