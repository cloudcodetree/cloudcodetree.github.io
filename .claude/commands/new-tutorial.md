---
description: Scaffold and author a new tutorial (MDX page + manifest entry + hero cover, plus a step-tagged companion repo for verified tutorials). Follows the create-tutorial skill.
argument-hint: "<slug> --series \"Series\" --title \"Subtitle\" [--type verified|anchored]"
allowed-tools: Bash(node scripts/:*), Bash(pnpm run:*), Bash(git add:*), Bash(git commit:*), Bash(git status:*), Bash(git fetch:*), Bash(git rebase:*), Read, Edit, Write
---

Create a new tutorial. **Follow the `create-tutorial` skill** (read it first for the rules).

Request: `$ARGUMENTS`

1. Decide the **type** — `verified` (runnable, tested, companion repo) or `anchored`
   (concept + official notebook, no "tested locally" claims). Ask if unclear.
2. Scaffold the stub (never hand-create the manifest entry or MDX boilerplate):
   `node scripts/scaffold-tutorial.mjs <slug> --series "…" --title "…" --type … [--with-repo]`
3. Author the content, replacing every `TODO`. Honor the hard rules:
   - **verified:** every code block + result must be from a real run; tag each step in the companion repo.
   - **anchored:** verify each external link is live; keep the GPU heads-up callout.
   - Avoid the MDX `<`-before-digit trap (write "under 1%", not `<1%`).
4. `pnpm build` (must pass); spot-check no horizontal overflow at 320px.
5. Ask before committing. If pushing is rejected, `git fetch && git rebase origin/main`, then push.
