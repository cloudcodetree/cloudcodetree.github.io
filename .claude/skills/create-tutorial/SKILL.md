---
name: create-tutorial
description: Use when adding a tutorial to the CloudCodeTree Tutorials section — a new part in an existing learning series or a brand-new series. Triggers include "create/add a tutorial", authoring files under app/tutorials/(article)/, scaffolding a tutorial companion repo, or running /new-tutorial.
---

# Creating a tutorial

Tutorials are hand-authored **MDX** at `app/tutorials/(article)/<slug>/page.mdx`, indexed in
`app/tutorials/manifest.ts`, grouped into **series** and shown with a branded hero cover.
Separate from the auto-generated AI News blog.

**Scaffold the stub mechanically, then author the content yourself.** The scaffolder gets
every mechanical detail right (composed title, OG image, `<TutorialHero>`, manifest entry,
sibling "Part k of M" bumps, cover). You write the prose and — for verified tutorials — the
tested code. Never hand-create the manifest entry or MDX boilerplate.

## Two types — pick first, it changes everything

- **verified** (default) — locally runnable code with a step-tagged companion repo
  (`tutorial-<slug>`). **Every code block and every result shown MUST come from a real run.**
- **anchored** — GPU/version-sensitive topics you can't run locally (fine-tuning, serving).
  No companion repo, **no "tested locally" claims**; teach the concept and link an official notebook.

## The one command

```bash
node scripts/scaffold-tutorial.mjs <slug> --series "Series Name" --title "Subtitle" \
     --type verified|anchored [--excerpt "…"] [--tags "Tutorial,RAG,Python"] \
     [--read 10] [--with-repo]
```
It appends the manifest entry (as the series' next part), bumps siblings' "(Part k of M)",
writes the MDX from a type-aware template full of `TODO` markers, and regenerates covers.
For verified tutorials, `--with-repo` also scaffolds the local companion repo
(then `node scripts/new-tutorial-repo.mjs <slug> --create-remote` to publish it). Run
`--help`-style by reading the script header for all flags. It never commits.

## Hard rules (the judgment the script can't do)

- **Verified: real output only.** Probe the corpus/query until the teaching example actually
  reproduces; test it in a venv; paste the *actual* output. If a claim doesn't reproduce, fix
  the example — never fabricate. Tag each step (`step-01`, …) in the companion repo.
- **Anchored: verify links are live** before linking (open them), keep the GPU `<Callout tone="warn">`,
  and make code snippets clearly illustrative.
- **MDX gotcha:** a bare `<` before a digit/space in prose (e.g. `<1%`) parses as JSX and fails
  the build — write "under 1%" or `&lt;1%`. (Inside fenced code it's fine.)
- **Fill every `TODO`** the template leaves (TL;DR, intro, sections, sources).

## After authoring

1. `pnpm build` — must compile and export.
2. Mobile check: no horizontal page overflow at 320px (code blocks scroll inside `<pre>` — that's fine).
3. Commit + push. If the push is rejected, the autonomous blog pipeline pushed first — `git fetch && git rebase origin/main`, then push.

## Conventions (reference)

- Display title is composed by `fullTitle()` as `Series: Subtitle (Part N of M)` — used for
  `<title>`/Open Graph; the UI shows a `Series · Part N/M` eyebrow + the subtitle. The scaffolder bakes it in.
- The manifest is the **single source of truth**: `scripts/generate-tutorial-covers.mjs` and the
  scaffolder both read it via `scripts/lib/tutorials-data.mjs`. Covers are committed (small fixed set).
- `app/tutorials/page.tsx` sorts by `order`, so manifest insertion position doesn't matter.
- Companion repo build is a **git-tag-per-step** progression (`main` = finished); README has a
  step compare-table. Scaffold with `scripts/new-tutorial-repo.mjs`.
