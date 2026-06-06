---
description: Show blog health — validate posts.json, list recent posts, and check for new Claude Desktop briefings to import.
allowed-tools: Bash(node scripts/:*), Bash(ls:*), Bash(git log:*), Read
---

Report the current state of the blog:

1. Run `node scripts/validate-blog.mjs` and show the result.
2. Show the post count and the 5 most recent posts (date · eyebrow · title) from
   `public/blog/posts.json`.
3. List the source briefings in `~/Documents/Claude/Projects/AI Developer News/`
   (`ls -1 *-ai-briefing.md`) and note the newest one, so we can see if there are days
   not yet imported.
4. Show the last few blog commits (`git log --oneline -5 -- public/blog/`).
5. Note whether the local auto-publish launchd agent is installed
   (`ls ~/Library/LaunchAgents/com.cloudcodetree.blog-sync.plist`). Summarize anything
   that needs attention (e.g. "run `node scripts/import-briefings.mjs` to pick up N new days").
