#!/usr/bin/env bash
# PostToolUse hook (Write|Edit|MultiEdit): keep the blog index consistent.
# Only acts when blog files were touched; blocks (exit 2) if posts.json is broken
# or references a missing markdown file.
set -euo pipefail

input="$(cat)"

# Pull the edited file path out of the hook payload (best-effort via node).
fp="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const ti=j.tool_input||{};process.stdout.write(ti.file_path||ti.path||"")}catch{process.stdout.write("")}})' 2>/dev/null || true)"

case "$fp" in
  *public/blog/*) ;;          # blog content changed — validate
  *) exit 0 ;;                 # unrelated edit — skip
esac

if ! out="$(node scripts/validate-blog.mjs 2>&1)"; then
  echo "Blog validation failed — posts.json and public/blog are out of sync:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
