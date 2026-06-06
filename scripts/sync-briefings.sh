#!/usr/bin/env bash
# Local auto-publish for the AI Developer News blog.
#
# Explodes the Claude Desktop "AI Developer News" briefings into individual blog
# posts, then commits & pushes to `main` (which triggers the GitHub Pages deploy).
#
# This runs LOCALLY (not in GitHub Actions) on purpose: the briefings live in a
# folder on this Mac that the cloud runner can't see. Run it by hand, or schedule
# it with launchd (see scripts/com.cloudcodetree.blog-sync.plist).
#
# Usage: scripts/sync-briefings.sh ["<briefings dir>"]
set -euo pipefail

# launchd runs with a minimal PATH — make sure node/git are found.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO="/Users/chris.harper/Development/cloudcodetree.github.io"
BRIEFINGS="${1:-$HOME/Documents/Claude/Projects/AI Developer News}"

cd "$REPO"
node scripts/import-briefings.mjs "$BRIEFINGS"
node scripts/validate-blog.mjs

if git diff --quiet -- public/blog/; then
  echo "No blog changes — nothing to publish."
  exit 0
fi

git add public/blog/
git commit -m "blog: sync AI briefings ($(date -u +%Y-%m-%d))"
git push
echo "Published blog updates to main."
