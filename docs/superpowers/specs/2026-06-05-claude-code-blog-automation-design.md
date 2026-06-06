# CloudCodeTree — Claude Code Tooling + Daily/Weekly Blog Automation

**Date:** 2026-06-05
**Status:** Approved (via `/goal` directive + clarifying answers)
**Author:** Chris Harper (with Claude Code)

## Goal

Set this Next.js portfolio repo up with a complete Claude Code toolchain (CLAUDE.md
rules, project skills, custom agents, slash commands, hooks, settings/permissions)
**and** an automated blog that publishes a daily AI-developer brief and a weekly
roundup, fed both by an automated cloud generator and by the existing Claude Desktop
article task.

## Context / Current State

- **Stack:** Next.js 15 (App Router), React 19, MUI v7, TypeScript, Tailwind v3.
- **Output:** `next build` → static export to `out/` → GitHub Pages via
  `.github/workflows/deploy.yml` (peaceiris) on push to `main`.
- **Blog:** static markdown. `public/blog/posts.json` is the index; each entry points
  at a `public/blog/<id>.md` file. `app/components/BlogPage.tsx` fetches
  `/blog/posts.json` then each `/blog/<filename>` at runtime and renders the raw
  markdown with `react-markdown` + `remark-gfm`.
- **Constraint:** published `.md` files contain **no frontmatter** (it would render as
  literal text). All metadata lives in `posts.json`.
- **Date format:** `MM-DD-YYYY` (e.g. `06-04-2026`). Posts are newest-first.
- **Existing Desktop output:** `public/blog/ai-dev-brief-context-bottleneck.md` — an
  "AI Developer Briefing" that defines the house style.

## Confirmed decisions

| Decision | Choice |
|---|---|
| Desktop handoff | Writes finished articles to a local folder |
| Automation host | GitHub Actions cron (cloud) |
| Cadence | Daily brief + weekly roundup |
| Tooling scope | Full kit |

**Reconciliation:** Actions cron can't read a local Mac folder, so there are two
entry paths into one shared publishing core:
1. **Automated** — Actions cron generates content via the Claude API (web search for
   live news), then commits to `main`.
2. **Manual/Desktop** — `/publish-post` + script ingests `.md` files the Desktop task
   drops into a local drafts folder, then commits.

## Architecture

### Publishing core — `scripts/publish-post.mjs`
Single source of truth (ESM, Node-only). Exports functions + runs as CLI.
- `parseFrontmatter`, `slugify`, `estimateReadTime`, `deriveExcerpt`, `inferTags`.
- `publishOne(srcPath, opts)`: strip frontmatter, copy body to `public/blog/<id>.md`,
  upsert entry into `posts.json` (dedupe by `id`, newest-first), validate.
- CLI modes: single file, or `--intake <dir>` to process all `.md` in a drafts dir.
- Flags: `--tags`, `--date`, `--author`, `--type daily|weekly`, `--commit`.

### Validator — `scripts/validate-blog.mjs`
Used by a hook and CI. Asserts: `posts.json` parses; every entry has required fields
(`id,title,excerpt,author,date,tags,readTime,filename`); referenced file exists; no
duplicate ids. Exit non-zero on failure.

### Generator — `scripts/generate-brief.mjs`
- Requires `ANTHROPIC_API_KEY`. `--type daily` → `claude-haiku-4-5`;
  `--type weekly` → `claude-opus-4-8`.
- Calls Anthropic Messages API with the `web_search` server tool for current
  AI-dev news; house-style prompt modeled on the existing briefing.
- Emits markdown (H1 title … closing italic line), then calls `publishOne`.

### Cron workflows
- `.github/workflows/blog-daily.yml` — weekday cron → daily brief → commit `main`.
- `.github/workflows/blog-weekly.yml` — weekly cron → roundup → commit `main`.
- Both: `permissions: contents: write`, secret `ANTHROPIC_API_KEY`, skip on forks,
  no-op if generation fails validation. Commit to `main` triggers existing deploy.
  No loop risk (deploy pushes to `gh-pages`, not `main`).

### Claude Code tooling (`.claude/`, project-scoped, committed)
- `settings.json` — permission allowlist + hooks.
- Hooks (`.claude/hooks/`): `validate-blog.sh` (PostToolUse Write/Edit → block broken
  `posts.json`); `secret-scan.sh` (PreToolUse Bash → block commits/pushes containing
  Anthropic/AWS keys or private keys).
- Skills (`.claude/skills/`): `publish-post`, `write-ai-brief`.
- Agents (`.claude/agents/`): `blog-editor`, `frontend-reviewer`.
- Commands (`.claude/commands/`): `/publish-post`, `/new-brief`, `/blog-status`.

### Rules
Refresh `CLAUDE.md`: correct stale Vite references to Next.js reality; add Blog
Automation and Claude Code Tooling sections documenting the pipeline and `posts.json`
schema.

## Non-goals (YAGNI)
No CMS, DB, or framework change. Reuse the existing static-markdown blog. Daily
generation is gated by the validator so a bad run never ships broken JSON.

## Risks
- **API cost** on the user's key (small daily/Haiku; modest weekly/Opus). Manual path
  uses no API.
- **`ANTHROPIC_API_KEY` secret** must be added to the repo by the user.
- **Web search tool** availability/version on the Messages API — pinned, documented.
