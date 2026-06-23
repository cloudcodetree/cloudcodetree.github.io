# Tutorials playbook

How the hand-authored **Tutorials** section works and how to add a new one. This
is separate from the auto-generated AI News blog (different content, different
pipeline).

## The three layers

1. **AI News blog** (`/`, auto) — daily breadth, including a teachable curriculum post.
2. **Tutorials** (`/tutorials`, hand-authored MDX) — durable, interactive depth.
3. **Companion code repos** (`github.com/cloudcodetree/tutorial-<slug>`) — the
   actual code, built as a **step-by-step git-tag progression** so learners can
   check out or diff any stage.

A tutorial links to its companion repo; the repo's README links back to the tutorial.

## Conventions

- **One repo per tutorial**, public, named `tutorial-<slug>` under `cloudcodetree`.
- **One annotated git tag per step**: `step-01`, `step-02`, … Each step is a
  commit that adds one coherent thing. `main` = the finished code.
- The repo README has a **step table with GitHub compare links**
  (`/compare/step-01...step-02`) so steps can be diffed in the browser.
- The site tutorial is an `.mdx` file; it includes a "code along" callout linking
  the repo and the per-step diffs.
- `<slug>` is lowercase letters/digits/hyphens and matches across the repo name,
  the route (`/tutorials/<slug>`), and the MDX folder.

## Adding a new tutorial

### 1. Companion code repo

```bash
# scaffold a sibling repo with step-01 already committed + tagged
node scripts/new-tutorial-repo.mjs <slug> --title "Human Title" --create-remote
```

Then build the code, committing and tagging each step, and push the tags:

```bash
cd ../tutorial-<slug>
# …make step 2's changes…
git add -A && git commit -m "step 2: <what>"
git tag -a step-02 -m "Step 2 - <what it adds>"
git push origin main --tags
```

Add a row to the README's compare table per step. (Omit `--create-remote` to
scaffold locally first and create the GitHub repo later.)

### 2. Site tutorial (MDX)

Create `app/tutorials/(article)/<slug>/page.mdx`:

```mdx
export const metadata = {
  title: '<Title> · Tutorials',
  description: '<one-line summary>',
  alternates: { canonical: 'https://cloudcodetree.com/tutorials/<slug>/' },
  openGraph: { title: '<Title>', description: '<summary>', url: 'https://cloudcodetree.com/tutorials/<slug>/', siteName: 'CloudCodeTree', type: 'article' },
};

# <Title>

**TL;DR: …**

<Callout tone="tip">
**Code along, version by version.** Full project at
[github.com/cloudcodetree/tutorial-<slug>](https://github.com/cloudcodetree/tutorial-<slug>).
Each step is a git tag — `git checkout step-01`, then `step-02`, …
</Callout>

## What you'll be able to do after this
- …
```

Then add an entry to `app/tutorials/manifest.ts`:

```ts
{
  slug: '<slug>',
  title: '<Title>',
  excerpt: '<one-line summary>',
  date: 'MM-DD-YYYY',
  tags: ['Tutorial', '<Topic>', '…'],
  order: <n>,           // ascending = learning-path position
  readTime: <minutes>,
}
```

### 3. Ship

`pnpm run build` (the article styling, `<Callout>`, sitemap entry, and nav are
already wired). Commit + push; the deploy publishes it.

## How it renders

- `app/tutorials/layout.tsx` wraps everything in the site chrome (`ClientLayout`).
- `app/tutorials/(article)/layout.tsx` styles the MDX (mobile-safe: code scrolls,
  long tokens wrap) and adds the "← Back to Tutorials" link. The author writes the
  `# H1`.
- Custom MDX components (e.g. `<Callout>`) live in `app/components/mdx/` and are
  exposed via the root `mdx-components.tsx`.
- `scripts/generate-feeds.mjs` auto-discovers tutorial slugs for the sitemap.
