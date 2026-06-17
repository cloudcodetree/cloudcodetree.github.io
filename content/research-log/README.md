# Research log

One file per UTC date (`YYYY-MM-DD.md`), written by the daily "AI News Publisher"
cloud routine (and any manual run). Each run appends an `## HH:MM UTC` section with:

- **Published** — what made it into the feed this run (`[bucket] <guid> — what`).
- **Considered but skipped** — candidates researched but not published, each with a
  one-line reason (duplicate, thin source, not significant, off-topic, no strong
  tutorial, etc.), including duplicate-guard skips.

This is the audit trail for editorial judgment — what got dropped and why. It is a
source artifact (not served by the site, like `content/feed.xml`). See
`docs/ai-news-feed-contract.md` → "Research log".
