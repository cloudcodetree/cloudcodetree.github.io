---
description: Publish a blog draft (a given file, or all drafts in ~/Downloads/cct-blog-drafts) — format, index in posts.json, validate, and commit.
argument-hint: "[path/to/draft.md]  (omit to ingest ~/Downloads/cct-blog-drafts)"
allowed-tools: Bash(node scripts/:*), Bash(git add:*), Bash(git commit:*), Bash(git status:*), Read, Edit
---

Publish a blog post using the project's publishing core. Follow the `publish-post` skill.

Target: `$ARGUMENTS`

Steps:
1. If a file path was given in `$ARGUMENTS`, publish that file:
   `node scripts/publish-post.mjs "$ARGUMENTS"`
   Otherwise ingest the local drafts folder:
   `node scripts/publish-post.mjs --intake ~/Downloads/cct-blog-drafts`
2. Run `node scripts/validate-blog.mjs` and confirm it passes.
3. Show the new `public/blog/posts.json` top entry and the created `.md` filename.
4. Ask whether to commit. If yes: `git add public/blog/ && git commit`. (Pushing to
   `main` triggers the deploy workflow.)

Do not hand-edit `posts.json`. If a draft lacks a title or reads thin, suggest running
the `blog-editor` agent first.
