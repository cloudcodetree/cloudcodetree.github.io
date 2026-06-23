# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is CloudCodeTree's professional portfolio website built with Next.js 15 (App Router), React 19, and TypeScript, statically exported and deployed to GitHub Pages. It showcases the professional profile of Chris Harper, a Principal Software Engineering Manager with extensive experience leading enterprise teams and cloud architecture initiatives. Features include:

- **Dark Professional Theme**: Uses Material-UI v7 with custom dark theme, glass morphism effects, and gradient accents
- **Hero Landing Page**: Professional intro with avatar, skills showcase, and service offerings
- **Resume Section**: Interactive resume showcasing extensive engineering leadership experience with multiple format downloads
- **AI News Blog**: Statically rendered markdown blog fed by an RSS ingest pipeline (see "Blog" below)
- **Contact Form**: Web3Forms-backed contact form and professional contact methods
- **Interview Scheduling**: Calendly integration for professional consultations
- **Responsive Design**: Mobile-first design with glass morphism, animations, and modern CSS
- **Custom Domain**: Configured for cloudcodetree.com with Route53 DNS and GitHub Pages
- **SEO Optimized**: Next.js Metadata API (per-page titles/descriptions, per-post Open Graph images, canonicals) + build-time sitemap.xml and RSS feed
- **Performance Optimized**: Static export, build-time blog rendering, paginated blog data chunks

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (Turbopack) at http://localhost:3000
pnpm run dev

# Build the static export (outputs to ./out)
pnpm run build

# Serve the production build locally
pnpm run start

# Lint code
pnpm run lint

# Manual deploy of ./out to gh-pages (normally automatic via GitHub Actions on push to main)
pnpm run deploy
```

> Note: deployment is normally automatic — pushing to `main` triggers
> `.github/workflows/deploy.yml`, which builds and publishes `./out` to GitHub Pages.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router) with static export (`output: 'export'` → `./out`)
- **Frontend**: React 19, TypeScript
- **UI Library**: Material-UI (MUI) v7 with custom dark theme (Emotion SSR cache)
- **CSS**: Tailwind CSS v3 with custom configuration
- **Routing**: Next.js App Router (file-based, under `app/`)
- **Animation**: Framer Motion
- **Markdown**: React Markdown with remark-gfm
- **Deployment**: GitHub Actions → GitHub Pages (gh-pages branch)
- **Domain**: Route53 DNS + GitHub Pages custom domain (cloudcodetree.com)

> Historical note: this project was migrated from Vite + React Router to Next.js. The
> legacy `src/` tree and Vite-era configs (netlify.toml, vercel.json) were removed in
> June 2026; the live app is the `app/` directory below.

### Project Structure
```
app/                          # Next.js App Router
├── layout.tsx               # Root layout (metadata, providers)
├── page.tsx                 # Home route (/)
├── ai-news/page.tsx         # "AI News" list route (/ai-news) → components/BlogPage (feed + pagination)
├── ai-news/[id]/page.tsx    # Article route (/ai-news/<id>) → components/BlogPost; generateStaticParams from posts.json
├── blog/…                   # Legacy: static redirect stubs (/blog, /blog/<id>) → /ai-news (components/Redirect)
├── resume/page.tsx          # Resume route (/resume)
├── contact/page.tsx         # Contact route (/contact)
├── schedule/page.tsx        # Schedule route (/schedule)
├── components/              # UI components (BlogPage, HomePage, ClientLayout, …)
├── config/                  # Config (calendly.ts)
└── lib/                     # theme.ts, mui.ts, emotionCache.ts, emailObfuscation.ts

scripts/                      # Blog automation (Node; deps: fast-xml-parser, sharp — used by ingest)
├── ingest-feed.mjs          # content/feed.xml (RSS 2.0 + Media RSS) → posts.json + CDN images
├── generate-feeds.mjs       # posts.json → public/feed.xml + sitemap.xml + blog/pages/<n>.json (prebuild + dev)
├── publish-post.mjs         # Manual publishing: draft → posts.json entry (content inline)
└── validate-blog.mjs        # Validate posts.json consistency

content/                      # Source feed the Desktop task writes (ingested at publish time)
└── feed.xml                 # RSS 2.0 + Media RSS — source of truth for 2026-06-09 onward

.claude/                      # Claude Code project tooling (see "Claude Code Tooling")
├── settings.json            # Hooks + protective deny rules
├── hooks/                   # validate-blog.sh, secret-scan.sh
├── skills/                  # publish-post
├── agents/                  # blog-editor, frontend-reviewer
└── commands/                # /publish-post, /blog-status

public/
├── blog/                    # Blog content
│   └── posts.json          # Index + inlined post bodies (images live on the Release CDN)
├── resume/                  # Resume assets
│   └── chris_harper-resume.md
├── resume.pdf              # Protected resume PDF
└── [standard PWA files]    # 404.html, robots.txt, sw.js, etc.
```

### Key Components

**ClientLayout.tsx**: Main application shell featuring:
- Responsive navigation (mobile drawer + desktop horizontal nav)
- Route-based page transitions with Framer Motion animations
- Glass morphism AppBar with backdrop blur effects
- Icon-based navigation with active state styling

**HomePage.tsx**: Professional landing page with:
- Hero section with gradient avatar and typography
- Interactive skills showcase with animated chips
- Services grid highlighting core competencies
- Call-to-action sections for resume and contact

**BlogPage.tsx / BlogPost.tsx**: the AI News blog (see "Blog" below):
- List page gets page 1 embedded at build time; later pages fetch
  `/blog/pages/<n>.json` chunks (10 posts each, generated at prebuild)
- Article pages are fully prerendered — the post is passed as a prop by the
  server route (`app/ai-news/[id]/page.tsx`), no client-side fetch
- Markdown rendered via `react-markdown` + `remark-gfm`

**ProjectsPage.tsx** (implemented, not in nav): featured projects + dynamic
GitHub repositories via REST API, with loading skeletons and error handling.

**Theme Configuration**: 
- Custom dark theme with blue/cyan gradient accents (#3b82f6, #06b6d4)
- Glass morphism effects using backdrop-filter and rgba backgrounds
- Responsive typography scaling for mobile/desktop
- Consistent component styling with rounded corners and hover effects

### External Integrations

**GitHub API** (ProjectsPage, not currently in nav):
- Fetches repository data from `https://api.github.com/users/cloudcodetree/repos`
- No authentication required for public repos

**Web3Forms** (contact form):
- ContactPage.tsx submits to the Web3Forms API with an access key that is
  client-exposed **by design** (it only routes mail to the configured inbox).
  Spam mitigation is handled by Web3Forms settings, not by hiding the key.

**Calendly Integration**:
- Configured URL: 'https://calendly.com/cloudcodetree'
- Supports both embedded widget and new-tab open

## Deployment

### Repository Structure
- **Repository**: `cloudcodetree/cloudcodetree.github.io`
- **Main Branch**: Contains source code (React, TypeScript, etc.)
- **gh-pages Branch**: Contains built/compiled files (auto-generated)
- **Deploy Command**: `pnpm run deploy` builds and pushes to gh-pages branch

### GitHub Pages Setup
1. Repository is named `cloudcodetree.github.io` for username pages
2. GitHub Pages serves from `gh-pages` branch automatically
3. Custom domain configured: `cloudcodetree.com`
4. HTTPS enforced via GitHub Pages settings

### DNS Configuration (Route53)
**A Records for cloudcodetree.com:**
- 185.199.108.153
- 185.199.109.153  
- 185.199.110.153
- 185.199.111.153

**CNAME Record:**
- www.cloudcodetree.com → cloudcodetree.github.io

### URLs
- **GitHub Pages**: `https://cloudcodetree.github.io/`
- **Custom Domain**: `https://cloudcodetree.com/`
- **Development**: `http://localhost:3000/`

## Content Management

### Blog Posts
See the **Blog ("AI News")** section below — posts live inline in
`public/blog/posts.json` and are managed exclusively through the scripts in
`scripts/` (never hand-edited).

### Resume PDF
- Store resume PDF in `public/resume.pdf`
- Contains sensitive contact information (protected by a `.claude` deny rule)

### GitHub Integration
- GitHub username set to 'cloudcodetree' in ProjectsPage.tsx
- Featured projects are manually curated in the featuredProjects array
- Real repositories are fetched from GitHub API dynamically
- No authentication required for public repositories

## Performance Considerations

- **Static export**: every route (incl. all blog articles) is prerendered HTML —
  no server, no client data fetch for article content
- **Paginated blog data**: the list page embeds page 1 and fetches ~28KB
  `/blog/pages/<n>.json` chunks on pagination instead of the whole posts.json
- **React 19 / Next 15**: build-time type + lint checks are ON
  (`next.config.js` no longer ignores build errors)
- **Lazy Loading**: Framer Motion animations animate when components enter viewport
- **Image hosting**: blog images live on the GitHub Release CDN, never in the repo
- **Service Worker**: Basic service worker (`sw.js`) included for PWA capabilities

## Security Notes

- The Web3Forms access key in ContactPage is public by design (see Integrations)
- No sensitive API keys exposed in client code
- All external links use rel="noopener noreferrer"
- HTTPS enforced on both GitHub Pages and custom domain
- `.claude/hooks/secret-scan.sh` blocks commits containing Anthropic/AWS keys or PEMs

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES2020+ features (optional chaining, nullish coalescing)
- **CSS Requirements**: 
  - CSS Grid and Flexbox (widely supported)
  - `backdrop-filter` for glass morphism effects (recent browsers)
  - CSS custom properties (CSS variables)
  - CSS `clamp()` for responsive typography
- **Fallbacks**: Glass morphism gracefully degrades without backdrop-filter
- **Mobile Support**: iOS 14+, Android Chrome 90+

## Development Workflow

1. **Local Development**: `pnpm run dev` serves at `http://localhost:3000/` with hot
   reload (it first runs `generate-feeds.mjs` so feed/sitemap/page chunks exist)
2. **Code Quality**: `pnpm run lint` for ESLint validation
3. **Type Checking**: enforced during `pnpm run build` (TS + ESLint failures fail the build)
4. **Build**: `pnpm run build` generates the static export in `./out`
5. **Deploy**: push to `main` → GitHub Actions builds and publishes (manual fallback: `pnpm run deploy`)
6. **Live Sites**:
   - GitHub Pages: `https://cloudcodetree.github.io/`
   - Custom Domain: `https://cloudcodetree.com/`
7. **DNS Management**: Route53 handles custom domain with A/CNAME records
8. **Content Updates**: blog content flows through the feed pipeline (see "Blog")

## Routing & SEO

- **Static export**: every route is a real prerendered HTML file — deep links work
  on GitHub Pages without SPA redirect tricks (`404.html` exists as fallback)
- **Metadata**: Next.js Metadata API — per-page `metadata` exports; blog articles
  get per-post title/description/canonical/Open Graph image via `generateMetadata`
- **Sitemap & feed**: `public/sitemap.xml` + `public/feed.xml` generated at prebuild
  (gitignored), advertised in robots.txt / `<link rel="alternate">`

## Navigation Structure

Nav (`app/components/ClientLayout.tsx`) is **AI News · Tutorials · About**.

**Current Active Routes**:
- `/` - **AI News blog** (the home/front door; `BlogPage`)
- `/ai-news/` - preserved legacy list (canonical → `/`); articles live at `/ai-news/<id>`
- `/tutorials` (+ `/tutorials/<slug>`) - hand-authored **MDX** tutorials (see Tutorials below)
- `/about` - the former home page, toned down (`HomePage`); the personal/portfolio hub
- `/about/resume`, `/about/contact`, `/about/schedule` - personal sub-routes
- `/resume`, `/contact`, `/schedule` - redirect stubs → the `/about/*` versions

**Available but not in nav**: `/projects` - ProjectsPage (implemented; enable by
adding it to the nav arrays in `app/components/ClientLayout.tsx`).

## Blog ("AI News")

The blog is labeled **AI News** in the nav and masthead; the route is **`/ai-news`**
(legacy `/blog` and `/blog/<id>` are static redirect stubs → `/ai-news`, via
`app/components/Redirect.tsx`, with `canonical` + `noindex`). It's **static markdown**:
`public/blog/posts.json` is the newest-first index; each entry points at a
post's body **inlined in `posts.json`** (no per-post `.md` files). The only committed blog
asset is `public/blog/posts.json`; **images are not in the repo** — they live on the GitHub
Release `blog-images` (CDN) and `posts.json` stores their URLs.

**Rendering.** The list (`/ai-news`, `app/ai-news/page.tsx` → `BlogPage`) embeds page 1
at build time (read from `posts.json` server-side) and, when paginating, fetches only
`/blog/pages/<n>.json` chunks (10 posts each, generated at prebuild, gitignored); the page
is kept in the URL as `?page=N`. Bodies render via `react-markdown` + `remark-gfm`. Each
post title links to `/ai-news/<id>` (`app/ai-news/[id]/page.tsx` → `BlogPost`); the server
route reads the post at build time and passes it as a prop — article HTML is fully baked,
with per-post Open Graph metadata from `generateMetadata`. Shared types/styling live in
`app/components/blogShared.ts`. All `/ai-news/<id>` pages are pre-rendered via
`generateStaticParams` (required for `output: 'export'`).

**Generated artifacts (emit).** `scripts/generate-feeds.mjs` runs at `prebuild` (and
before `dev`; also `npm run feeds`) and builds, from `posts.json`:
`public/feed.xml` (RSS 2.0 + Media RSS + `content:encoded`; item links point to
`/ai-news/<id>`, images absolute), `public/sitemap.xml` (static routes + every article),
and `public/blog/pages/<n>.json` (the list's pagination chunks). All three are gitignored
(regenerated each build). The feed is discoverable via a `<link rel="alternate">` in
`app/layout.tsx`, the sitemap via robots.txt. This is separate from the **ingest** feed at
`content/feed.xml` (task → site).

**Hard rules**
- Post bodies are Markdown stored inline in `posts.json` `content` (no `.md` files, no YAML
  frontmatter). All metadata lives in `posts.json`.
- Dates are `MM-DD-YYYY`. Posts are newest-first.
- `id` == `posts.json` `id` (== the feed `<guid>`).
- `posts.json` entry schema: `id, title, excerpt, author, date, tags[], readTime, content,
  image` plus optional `imageSource` / `dek`. `image` is a **CDN URL** to a GitHub Release
  asset (`https://github.com/<repo>/releases/download/blog-images/<id>.jpg`), falling back to
  `…/blog-images/_default.png`. Images are never committed to the repo.
  Posts are not separated by category (the old `eyebrow` badge was removed).
- **Never hand-edit `posts.json`** — go through the scripts below.

**Primary source — an RSS feed (ingestion).** Since the 2026-06-09 cutover, posts come
from a single **RSS 2.0 + Media RSS** feed that the Claude Desktop "AI Developer News"
task maintains at `content/feed.xml` (the source of truth, committed; not under `public/`).
The full feed format + the task prompt live in `docs/ai-news-feed-contract.md`. Ingest it
with:
```bash
node scripts/ingest-feed.mjs [content/feed.xml] [--no-images] [--refresh-images]
```
Each `<item>` UPSERTS a post keyed by `<guid>` (== `id`): `<content:encoded>` CDATA → the
`content` field (Markdown), `<media:content>`/`<media:thumbnail>` URL → the featured image,
which ingest **downloads, compresses (`sips`, 1200px / JPEG q78), and uploads to the
`blog-images` GitHub Release** (`posts.json` stores the CDN URL; `imageSource` = `<link>`),
tags from `<category>`. It's a **merge, not a rebuild**: posts not in the feed are preserved.
Idempotent; an image already uploaded for an id is reused unless `--refresh-images`. Requires
`gh` (authenticated) + sharp; without them, posts get the placeholder (CI's
`rehost-images` job fixes those on the next push). The `2026-05-28`–`2026-06-08` posts
are the back-catalog from the retired Desktop-briefings importer (removed June 2026);
they live only in `posts.json` now. `2026-06-09` onward is the feed.

**Auto-publish (cloud).** The daily **"AI News Publisher" Claude Code cloud routine**
(claude.ai/code/routines, 12:02 UTC) researches the day's stories, updates
`content/feed.xml` per `docs/ai-news-feed-contract.md`, runs ingest + `validate-blog`,
and commits/pushes — no local machine involved. The routine's environment can't
authenticate `gh`, so its posts land with placeholder images; the **`rehost-images`
job in `.github/workflows/deploy.yml`** then uploads the real images to the
`blog-images` Release (via `GITHUB_TOKEN`) and commits the CDN URLs before the same
run builds and deploys.

**Manual fallback.** If the routine is down, publish by hand: edit `content/feed.xml`
per the contract, then `node scripts/ingest-feed.mjs && node scripts/validate-blog.mjs`,
commit `content/feed.xml` + `public/blog/`, and push. (The pre-cloud Desktop-task +
launchd-watcher pipeline was removed in June 2026 — see git history for
`scripts/push-feed.sh` if it's ever needed again.)

**Manual / one-off posts** — drop a `.md` (optionally with frontmatter) and run
`node scripts/publish-post.mjs <file> --commit`, or `--intake ~/Downloads/cct-blog-drafts`,
or the `/publish-post` command.

Validate anytime with `node scripts/validate-blog.mjs` (CI and a hook run this too).
The `rehost-images` CI job also runs `node scripts/validate-research-log.mjs`,
which fails the build if a routine run's research log claims posts that aren't in
`content/feed.xml` (guards the "log says published, content missing" bug).

## Tutorials (hand-authored, separate from the blog)

`/tutorials` is a **hand-written, interactive** learning section, fully decoupled
from the auto-generated AI News blog. **Full convention + how-to:
`docs/tutorials-playbook.md`** — read that before adding one. In short:

- Tutorials are **MDX** files at `app/tutorials/(article)/<slug>/page.mdx` (via
  `@next/mdx`; `pageExtensions` includes `mdx`; root `mdx-components.tsx` exposes
  custom components like `<Callout>` from `app/components/mdx/`). List metadata
  lives in `app/tutorials/manifest.ts`; the list UI (`TutorialsList`, cards/list +
  topic filter + per-page) mirrors the blog. `app/tutorials/layout.tsx` adds site
  chrome; `app/tutorials/(article)/layout.tsx` styles the MDX + back link.
- Each tutorial has a **companion code repo** `github.com/cloudcodetree/tutorial-<slug>`
  (public) where the build is a **step-by-step git-tag progression** (`step-01`,
  `step-02`, …; `main` = final) so learners can check out or diff any step. The
  MDX links the repo + per-step compare URLs.
- Scaffold a new companion repo with
  `node scripts/new-tutorial-repo.mjs <slug> --title "…" [--create-remote]`.
- First tutorial: `build-a-rag-over-your-blog` (repo: `tutorial-rag-over-blog`).
- `scripts/generate-feeds.mjs` auto-discovers tutorial slugs for the sitemap.

## Claude Code Tooling

Project-scoped Claude Code config lives in `.claude/`:

- **Skills** (`.claude/skills/`): `publish-post` (the blog publishing workflow).
- **Agents** (`.claude/agents/`): `blog-editor` (style/excerpt/tags/fact-flag pass on a
  draft), `frontend-reviewer` (Next.js/MUI/static-export/a11y review of UI changes).
- **Slash commands** (`.claude/commands/`): `/publish-post`, `/blog-status`.
- **Hooks** (`.claude/hooks/`, wired in `settings.json`):
  - `validate-blog.sh` — PostToolUse on Write/Edit; blocks if a `public/blog/` change
    leaves `posts.json` inconsistent.
  - `secret-scan.sh` — PreToolUse on Bash; blocks `git commit`/`git push` when the diff
    contains an Anthropic/AWS key or PEM private key.
- **Settings** (`.claude/settings.json`): hooks + protective `deny` rules (resume PDF,
  `.env*`). A convenience permission allowlist is intentionally left out of the committed
  file — add per-developer allows to `.claude/settings.local.json` if desired, e.g.
  `Bash(pnpm run:*)`, `Bash(node scripts/:*)`, `Bash(git commit:*)`.

The design spec for this setup is in
`docs/superpowers/specs/2026-06-05-claude-code-blog-automation-design.md`.