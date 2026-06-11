---
name: publish-post
description: Use when publishing a markdown article to the CloudCodeTree blog — ingesting a draft (from the local drafts folder ~/Downloads/cct-blog-drafts or a given file), formatting it, indexing it in posts.json, and optionally committing. Covers the blog's static-markdown pipeline and conventions.
---

# Publishing a blog post

The blog is **static markdown**. `public/blog/posts.json` is the newest-first index;
each entry points at a `public/blog/<id>.md` file. `app/components/BlogPage.tsx`
fetches the JSON then each `.md` and renders it raw with `react-markdown`.

## Hard rules
- **Published `.md` must have NO frontmatter** — it renders as literal text. The
  publishing core strips frontmatter and lifts it into `posts.json`.
- Dates are `MM-DD-YYYY`. Posts are newest-first (prepend).
- `id` == filename stem == `posts.json` `id`. Keep them identical.
- Every `posts.json` entry needs: `id, title, excerpt, author, date, tags, readTime, filename`.

## The one command to use
Always route through the publishing core — never hand-edit `posts.json`:

```bash
# Publish one draft file:
node scripts/publish-post.mjs path/to/draft.md --commit

# Ingest everything in the local drafts folder:
node scripts/publish-post.mjs --intake ~/Downloads/cct-blog-drafts --commit
```

Useful flags: `--tags AI,LLM`  `--date 06-05-2026`  `--author "Chris Harper"`
`--id custom-slug`  `--title "Override Title"`. Omit `--commit` to stage without committing.

## After publishing
1. Run `node scripts/validate-blog.mjs` (the PostToolUse hook also does this).
2. If committing to `main`, the `Deploy to GitHub Pages` Action ships it automatically.
3. Spot-check locally with `pnpm dev` → http://localhost:3000/blog.

## Drafts folder convention
Drop finished `.md` drafts into
`~/Downloads/cct-blog-drafts/`. They may include YAML frontmatter
(`title`, `excerpt`, `tags`, `date`, `author`) — the core uses it for metadata and
strips it from the published body. If absent, metadata is derived (title from the H1,
excerpt from the first paragraph, tags inferred, readTime from word count).
