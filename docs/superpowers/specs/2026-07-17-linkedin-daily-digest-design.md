# LinkedIn Daily Digest — Design

**Date:** 2026-07-17
**Status:** Approved (brainstorm), pending spec review
**Owner:** Chris Harper

## Problem

The blog auto-publishes 5–9 AI-news posts per day via the "AI News Publisher" cloud
routine. We want that content to also reach LinkedIn **without tripping LinkedIn's
spam heuristics** — which fire on automated, high-frequency, identical-to-source,
link-heavy posts from the same actor.

Posting each article individually would be exactly that anti-pattern (5–9 near-identical
link-drops/day from one profile). Instead we post **one "Today in AI" digest per day**
that rolls the day's posts into a single, LinkedIn-native update.

## Decisions (locked during brainstorm)

- **Content model:** one daily digest summarizing that day's blog posts (not per-article).
- **Posting method:** auto-post via the LinkedIn API (fully hands-off).
- **Target surface:** personal profile (`urn:li:person:{id}`).
- **API product:** self-serve **"Share on LinkedIn"** → `w_member_social` scope
  (the approvable path; Marketing Developer Platform is *not* needed for personal posts).
- **Composition:** LLM-written hook + one-line summaries, with a deterministic template
  fallback and a quality guard.
- **Runtime home:** a dedicated GitHub Actions cron workflow (decoupled from publishing),
  matching the existing `rehost-images` pattern.
- **Dead-token behavior:** open/refresh a GitHub Issue to nag (do not fail silently).

## Non-goals (YAGNI)

- Company Page posting (personal profile only).
- Per-article posting.
- A scheduling UI or third-party scheduler (Buffer/Hootsuite/Zapier).
- Cross-posting to other networks (X, Mastodon, etc.).
- Backfilling historical days automatically (a `--date` flag exists for manual one-offs).

## Architecture & data flow

```
GitHub Actions cron (daily, ~16:00 UTC + in-script jitter; also workflow_dispatch)
        │
        ▼
scripts/linkedin-digest.mjs   ── orchestrator
   1. select today's posts    ← public/blog/posts.json (date == today UTC)
   2. idempotency check        ← content/linkedin-log.json  (already posted today? → no-op)
   3. compose digest           → scripts/lib/digest-compose.mjs  (LLM + guard + template fallback)
   4. post to profile          → scripts/lib/linkedin-client.mjs  createPost(personURN, text)
   5. link in FIRST COMMENT    → linkedin-client.createComment(postUrn, https://cloudcodetree.com/ai-news)
   6. append result            → content/linkedin-log.json  (date → {postUrn, commentUrn, at})
        │
        ▼
   workflow commits content/linkedin-log.json back to main
```

Runs ~4 hours after the 12:02 UTC publisher + deploy so `posts.json` on `main` is fresh.

### Components (isolated, independently testable)

1. **`scripts/lib/linkedin-client.mjs`** — thin LinkedIn REST wrapper.
   - `createPost(personUrn, text) -> postUrn`
   - `createComment(postUrn, text) -> commentUrn`
   - `checkTokenExpiry(token) -> { expiresAt, daysLeft }`
   - `refreshToken(refreshToken) -> accessToken` (only used if a refresh token is present)
   - Injects `fetch` for mockability; maps 401 / 429 / 5xx to typed errors.
2. **`scripts/lib/digest-compose.mjs`** — day's posts → post text.
   - LLM call returns `{ hook, items[], hashtags[] }`. **No LLM key exists in CI today**
     (workflows reference only `GITHUB_TOKEN` and `PEXELS_API_KEY`), so this adds a new
     secret — `ANTHROPIC_API_KEY` (direct Claude, default) or `OPENROUTER_API_KEY`.
   - Guard + deterministic template fallback. Injects the LLM client for mockability.
3. **`scripts/linkedin-digest.mjs`** — glue: select posts, idempotency, order-of-operations,
   logging. Flags: `--dry-run` (compose & print, no network), `--date=MM-DD-YYYY` (backfill/test).

### New files

- `scripts/linkedin-digest.mjs`
- `scripts/lib/linkedin-client.mjs`
- `scripts/lib/digest-compose.mjs`
- `.github/workflows/linkedin-digest.yml` (cron + `workflow_dispatch`)
- `content/linkedin-log.json` (committed audit/idempotency log)
- `docs/linkedin-digest-contract.md` (setup + secrets runbook)

## Anti-spam mechanics (enforced in code)

| Mechanism | Implementation | Rationale |
|---|---|---|
| 1 post/day, hard | `linkedin-log.json` records posted dates; orchestrator no-ops if today logged | Re-runs/retries can never double-post |
| No empty posts | Zero posts dated today → exit 0 silently | Never posts "0 stories" when the routine is paused |
| Time jitter | Fixed cron ~16:00 UTC, then random 0–40 min sleep before posting | Identical-second posting is a bot fingerprint |
| Varied hook | LLM writes a fresh intro line daily | Structural sameness is a bot fingerprint |
| Link in first comment | Post body has no URL; a follow-up comment carries the `/ai-news` link | Dodges LinkedIn's outbound-link reach penalty; reads as commentary |
| ≤3 hashtags | LLM instructed + guard truncates | >3 hashtags is a spam signal |
| No URL shorteners | Always full canonical `https://cloudcodetree.com/ai-news` | Shorteners are flagged by LinkedIn |
| Native length cap | Guard caps at 3000 chars (LinkedIn limit) | — |

## Digest composition

**Input:** the day's posts (`title`, `excerpt`/`dek`, `tags`, `id`).

**LLM output (structured JSON):** `{ hook, items[], hashtags[] }` — a 1–2 line hook,
one punchy line per story, ≤3 tags.

**Assembled post:**
```
<hook>

🔹 <one-liner 1>
🔹 <one-liner 2>
… (one per post, 5–9)

Full roundup in the comments 👇

#AI #MachineLearning #<one more>
```

**Guard:** item count matches posts; ≤3 hashtags; ≤3000 chars; no bare URLs in body.
On failure → 1 retry → deterministic template fallback (title + trimmed excerpt per post).
The poster never emits garbage and never silently posts nothing on an LLM hiccup.

## Error handling & token lifecycle

**Token lifecycle (primary fragility)**
- Secrets: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN`, optional `LINKEDIN_REFRESH_TOKEN`,
  plus a new LLM key (`ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY`) — none exists in CI today.
- Preflight expiry check each run: within 7 days of expiry → open/update a GitHub Issue
  ("LinkedIn token expiring") and still post; already expired → fail loudly, no post.
- Optional auto-refresh: if `LINKEDIN_REFRESH_TOKEN` is present (requires LinkedIn approval
  for programmatic refresh), exchange it for a fresh access token each run. Opt-in so the
  poster works day one without it.

**Runtime failures**

| Situation | Behavior |
|---|---|
| No posts dated today | Exit 0, log `skipped: no posts`, no LinkedIn call |
| Today already in `linkedin-log.json` | Exit 0, no-op |
| LLM fails / guard rejects (after 1 retry) | Deterministic template fallback |
| Post returns 401 (dead token) | Fail loudly, exit non-zero, open issue; no blind retry |
| Post returns 429 / 5xx | Retry with backoff (≤2), then fail |
| Post succeeded, comment failed | Log post as done (never repost); record `commentError`; non-fatal |

**Idempotency ordering:** the post URN is written to `linkedin-log.json` the instant the
post succeeds, *before* the comment is attempted — idempotency is anchored on the
irreversible action so a failed comment can be retried by hand without double-posting.

## Testing

- **Unit — `digest-compose`** (mock LLM): daily variation, guard rejects, template fallback,
  hashtag cap, length cap.
- **Unit — `linkedin-client`** (mock `fetch`): post/comment payload shape, 401/429/5xx
  mapping, token-expiry decode.
- **Idempotency:** log read → post → same date no-ops.
- **Dry run:** `node scripts/linkedin-digest.mjs --dry-run --date=06-29-2026` renders a real
  digest from current `posts.json` with zero network — used to eyeball output before go-live.
- **Manual go-live:** first real post via `workflow_dispatch` (watch it land once) before
  enabling the daily cron.

## Scheduling

- Cron ~16:00 UTC daily (a few hours after the 12:02 UTC publisher + deploy), plus in-script
  random 0–40 min jitter. Hard 1/day cap enforced by the log, independent of schedule drift.

## One-time manual setup (outside the code)

1. Create a LinkedIn app at developer.linkedin.com; request the **"Share on LinkedIn"** product.
2. Run the OAuth flow once to mint an access token; fetch the person URN via `GET /v2/userinfo`.
3. Add GitHub Secrets: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN`,
   optional `LINKEDIN_REFRESH_TOKEN`, and a new LLM key
   (`ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY`).
4. Trigger the first real post via `workflow_dispatch`; verify on-profile; then rely on cron.

## Open dependency

The AI News Publisher routine currently appears paused (newest posts dated 06-29). The digest
no-ops cleanly when a day has no posts, so it is safe to ship regardless — but it only produces
value once the routine resumes publishing.
