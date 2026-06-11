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
#
# Failure handling: a lock dir serializes concurrent fires; any failure is
# recorded in /tmp/cct-feed-sync.failed (timestamped log) for inspection, and
# a commit whose push failed is pushed by the next run.
set -euo pipefail

# launchd runs with a minimal PATH — make sure node/git are found.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO="/Users/chris.harper/Development/cloudcodetree.github.io"
FEED="$REPO/content/feed.xml"
LOCK="/tmp/cct-feed-sync.lock"
FAILED="/tmp/cct-feed-sync.failed"

# Serialize runs: launchd WatchPaths can fire while a previous run is mid-commit.
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "another feed-sync run is in progress — skipping."
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT
trap 'echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) feed-sync failed (line $LINENO)" >> "$FAILED"' ERR

cd "$REPO"

# Nothing to do until the task has written a feed.
[ -f "$FEED" ] || { echo "no feed yet at content/feed.xml — skipping."; exit 0; }

# Stay current with origin so the push fast-forwards (best-effort; never blocks).
git fetch origin main -q 2>/dev/null || true
git merge --ff-only origin/main -q 2>/dev/null || true

# Feed → posts.json + re-hosted images.
node scripts/ingest-feed.mjs
node scripts/validate-blog.mjs

# Stage only the feed and generated blog content.
git add content/feed.xml public/blog/

push_with_retry() {
  git push origin main || { sleep 20; git push origin main; }
}

if git diff --cached --quiet; then
  # Nothing new — but recover a previous blog commit whose push failed.
  # Only auto-push when EVERY unpushed commit is a blog commit, so a deliberate
  # local (non-blog) commit is never published behind the user's back.
  unpushed="$(git log origin/main..main --pretty=%s 2>/dev/null || true)"
  if [ -n "$unpushed" ] && ! echo "$unpushed" | grep -qv '^blog: '; then
    push_with_retry
    rm -f "$FAILED"
    echo "recovered: pushed previously-unpushed blog commit(s)."
  else
    echo "no blog changes — nothing to publish."
  fi
  exit 0
fi

git commit -m "blog: ingest AI News feed ($(date -u +%Y-%m-%d))"
push_with_retry
rm -f "$FAILED"
echo "published AI News updates to main."
