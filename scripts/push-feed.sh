#!/usr/bin/env bash
# push-feed.sh — publish the AI News blog from the syndication feed.
#
# Fired by launchd whenever the Claude Desktop task updates content/feed.xml
# (see scripts/com.cloudcodetree.feed-sync.plist). It ingests the feed into
# blog posts + re-hosted images, then commits & pushes — which triggers the
# GitHub Pages deploy. Runs LOCALLY because image re-hosting needs the network
# once (CI then just builds the committed result).
#
# Idempotent: if the feed produced no changes, it commits nothing and exits 0.
# It only ever stages content/feed.xml and public/blog/, so any unrelated
# in-progress work in the tree is left untouched.
set -euo pipefail

# launchd runs with a minimal PATH — make sure node/git are found.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO="/Users/chris.harper/Development/cloudcodetree.github.io"
FEED="$REPO/content/feed.xml"

cd "$REPO"

# Nothing to do until the task has written a feed.
[ -f "$FEED" ] || { echo "no feed yet at content/feed.xml — skipping."; exit 0; }

# Stay current with origin so the push fast-forwards (best-effort; never blocks).
git fetch origin main -q 2>/dev/null || true
git merge --ff-only origin/main -q 2>/dev/null || true

# Feed → posts.json + .md + re-hosted images.
node scripts/ingest-feed.mjs
node scripts/validate-blog.mjs

# Stage only the feed and generated blog content.
git add content/feed.xml public/blog/

if git diff --cached --quiet; then
  echo "no blog changes — nothing to publish."
  exit 0
fi

git commit -m "blog: ingest AI News feed ($(date -u +%Y-%m-%d))"
git push origin main
echo "published AI News updates to main."
