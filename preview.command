#!/bin/bash
# Double-click this file in Finder to preview the site locally.
# It serves from THIS folder on your machine and opens the blog in your browser.
cd "$(dirname "$0")" || exit 1

echo "==> CloudCodeTree local preview"
echo "    Folder: $(pwd)"
echo

# Ensure pnpm is available (the project uses pnpm)
if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> pnpm not found — enabling via corepack..."
  corepack enable 2>/dev/null || npm install -g pnpm
fi

echo "==> Installing dependencies (first run only, may take a minute)..."
pnpm install || { echo "Install failed. Run 'pnpm install' manually."; read -r; exit 1; }

echo
echo "==> Starting dev server at http://localhost:3000"
echo "    Opening /blog in your browser shortly. Press Ctrl+C here to stop."
echo

# Open the blog page once the server is up
( for i in $(seq 1 30); do
    if curl -s -o /dev/null http://localhost:3000/blog/; then
      open "http://localhost:3000/blog"; break
    fi
    sleep 1
  done ) &

pnpm dev
