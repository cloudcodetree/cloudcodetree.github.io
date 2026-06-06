#!/usr/bin/env bash
# PreToolUse hook (Bash): block `git commit`/`git push` when the diff contains
# something that looks like a live secret (Anthropic key, AWS access key, or a
# PEM private key). Exit 2 blocks the tool call and feeds the reason back.
set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write((j.tool_input&&j.tool_input.command)||"")}catch{process.stdout.write("")}})' 2>/dev/null || true)"

case "$cmd" in
  *"git commit"*|*"git push"*)
    diff="$( { git diff --cached; git diff; } 2>/dev/null || true )"
    if printf '%s' "$diff" | grep -Eq 'sk-ant-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----'; then
      echo "BLOCKED: a potential secret (Anthropic key, AWS key, or private key) is present in the diff. Remove it (use a GitHub Actions secret / env var) before committing." >&2
      exit 2
    fi
    ;;
esac
exit 0
