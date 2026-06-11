---
description: Show blog health — validate posts.json, list recent posts, and check the cloud publishing pipeline.
allowed-tools: Bash(node scripts/:*), Bash(ls:*), Bash(git log:*), Bash(gh run list:*), Read
---

Report the current state of the blog:

1. Run `node scripts/validate-blog.mjs` and show the result.
2. Show the post count and the 5 most recent posts (date · title) from
   `public/blog/posts.json`.
3. Freshness: compare the newest post's date to today. Posts come from the daily
   "AI News Publisher" cloud routine (claude.ai/code/routines, 12:02 UTC). If the
   newest post is more than ~36 hours old, the routine probably failed — tell the
   user to check the routine's runs.
4. Show the last few blog commits (`git log --oneline -5 -- public/blog/`).
5. Check recent deploys (`gh run list --branch main --limit 3`) and note any
   failures — the `rehost-images` job is what upgrades routine posts from
   placeholder images to CDN images.

Summarize anything that needs attention.
