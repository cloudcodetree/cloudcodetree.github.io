# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is CloudCodeTree's professional portfolio website built with Next.js 15 (App Router), React 19, and TypeScript, statically exported and deployed to GitHub Pages. It showcases the professional profile of Chris Harper, a Principal Software Engineering Manager with extensive experience leading enterprise teams and cloud architecture initiatives. Features include:

- **Dark Professional Theme**: Uses Material-UI v6 with custom dark theme, glass morphism effects, and gradient accents
- **Hero Landing Page**: Professional intro with avatar, skills showcase, and service offerings
- **Resume Section**: Interactive resume showcasing extensive engineering leadership experience with multiple format downloads
- **Projects Showcase**: Featured projects + dynamic GitHub repositories via API integration
- **Dynamic Blog System**: Markdown-based blog with external file loading, search, and tag filtering
- **Contact Form**: Direct email integration and professional contact methods
- **Interview Scheduling**: Calendly integration for professional consultations
- **Responsive Design**: Mobile-first design with glass morphism, animations, and modern CSS
- **Custom Domain**: Configured for cloudcodetree.com with Route53 DNS and GitHub Pages
- **SEO Optimized**: React Helmet for dynamic meta tags and page titles
- **Performance Optimized**: Code splitting, lazy loading, and optimized bundle size

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

> Historical note: this project was migrated from Vite + React Router to Next.js. A
> legacy `src/` tree may still exist, but the live app is the `app/` directory below.

### Project Structure
```
app/                          # Next.js App Router
├── layout.tsx               # Root layout (metadata, providers)
├── page.tsx                 # Home route (/)
├── blog/page.tsx            # "AI News" list route (/blog) → components/BlogPage (feed + pagination)
├── blog/[id]/page.tsx       # Article route (/blog/<id>) → components/BlogPost; generateStaticParams from posts.json
├── resume/page.tsx          # Resume route (/resume)
├── contact/page.tsx         # Contact route (/contact)
├── schedule/page.tsx        # Schedule route (/schedule)
├── components/              # UI components (BlogPage, HomePage, Layout, ClientLayout, …)
├── config/                  # Config (calendly.ts)
└── lib/                     # theme.ts, mui.ts, emotionCache.ts, emailObfuscation.ts

scripts/                      # Blog automation (Node, no deps)
├── publish-post.mjs         # Publishing core: draft → public/blog/<id>.md + posts.json
├── import-briefings.mjs     # Explode "AI Developer News" digests → one post per item
└── validate-blog.mjs        # Validate posts.json ↔ public/blog consistency

.claude/                      # Claude Code project tooling (see "Claude Code Tooling")
├── settings.json            # Hooks + protective deny rules
├── hooks/                   # validate-blog.sh, secret-scan.sh
├── skills/                  # publish-post
├── agents/                  # blog-editor, frontend-reviewer
└── commands/                # /publish-post, /blog-status

public/
├── blog/                    # External blog content
│   ├── posts.json          # Blog posts index
│   └── *.md                 # Individual blog post markdown files
├── resume/                  # Resume assets
│   └── chris_harper-resume.md
├── resume.pdf              # Protected resume PDF
└── [standard PWA files]    # 404.html, robots.txt, sw.js, etc.
```

### Key Components

**Layout.tsx**: Main application shell featuring:
- Responsive navigation (mobile drawer + desktop horizontal nav)
- Route-based page transitions with Framer Motion animations
- SEO optimization with React Helmet for dynamic page titles
- Glass morphism AppBar with backdrop blur effects
- Icon-based navigation with active state styling

**HomePage.tsx**: Professional landing page with:
- Hero section with gradient avatar and typography
- Interactive skills showcase with animated chips
- Services grid highlighting core competencies
- Call-to-action sections for resume and contact

**ProjectsPage.tsx**: Comprehensive project showcase:
- Featured projects section with curated highlights
- Dynamic GitHub repositories via REST API
- Language-specific color coding and repository stats
- Loading skeletons and error handling

**BlogPage.tsx**: Dynamic blog system featuring:
- External markdown file loading from `/public/blog/`
- Full-text search and tag-based filtering
- Individual post view with proper markdown rendering
- Responsive grid layout with loading states

**Theme Configuration**: 
- Custom dark theme with blue/cyan gradient accents (#3b82f6, #06b6d4)
- Glass morphism effects using backdrop-filter and rgba backgrounds
- Responsive typography scaling for mobile/desktop
- Consistent component styling with rounded corners and hover effects

### External Integrations

**GitHub API**: 
- Fetches repository data from `https://api.github.com/users/cloudcodetree/repos`
- GitHub username is set to 'cloudcodetree'
- No authentication required for public repos

**EmailJS Configuration**:
- Service ID, Template ID, and Public Key need to be configured
- Replace placeholder values in ContactPage.tsx
- Sends emails to chris@cloudcodetree.com

**reCAPTCHA**: 
- Test site key used (6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI)
- Replace with production site key for real deployment

**Calendly Integration**:
- Configured URL: 'https://calendly.com/cloudcodetree'
- Supports both embedded widget and popup modal

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
- **Development**: `http://localhost:5173/`

### Environment Variables
For production deployment, configure:
- EmailJS Service ID, Template ID, Public Key
- reCAPTCHA site key (production)
- GitHub username for API calls (currently: cloudcodetree)

## Content Management

### Blog Posts
- **Dynamic Blog System**: Posts loaded from external markdown files in `/public/blog/`
- **Posts Index**: `posts.json` contains metadata for all blog posts
- **Markdown Content**: Individual `.md` files for each blog post with full content
- **Post Structure**: Each post includes title, excerpt, content, author, date, tags, readTime, filename
- **Built-in Features**: Search functionality, tag filtering, individual post view
- **Current Posts**: AWS Security, Microservices with Kubernetes, React Best Practices
- **Expandable**: Add new posts by updating `posts.json` and adding markdown files

### Resume PDF
- Store resume PDF in `public/resume.pdf`
- Protected by reCAPTCHA verification
- Contains sensitive contact information

### GitHub Integration
- GitHub username set to 'cloudcodetree' in ProjectsPage.tsx
- Featured projects are manually curated in the featuredProjects array
- Real repositories are fetched from GitHub API dynamically
- No authentication required for public repositories

## Performance Considerations

- **React 19**: Latest React version with improved performance and concurrent features
- **Vite Build System**: Fast development and optimized production builds
- **Tree Shaking**: Automatic dead code elimination for smaller bundles
- **Code Splitting**: Ready for implementation with React.lazy for page-level splits
- **Lazy Loading**: Framer Motion animations only load when components enter viewport
- **API Optimization**: GitHub API calls with error handling and loading states
- **Image Optimization**: Store optimized images in `public/assets/` directory
- **Service Worker**: Basic service worker (`sw.js`) included for PWA capabilities
- **Bundle Analysis**: Monitor bundle size and consider code splitting for further optimization
- **Responsive Loading**: Skeleton loaders provide immediate feedback during data fetching

## Security Notes

- reCAPTCHA protects resume download from bots
- EmailJS prevents email spam and protects backend
- No sensitive API keys exposed in client code
- All external links use rel="noopener noreferrer"
- HTTPS enforced on both GitHub Pages and custom domain

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

1. **Local Development**: `pnpm run dev` serves at `http://localhost:5173/` with hot reload
2. **Code Quality**: `pnpm run lint` for ESLint validation
3. **Type Checking**: TypeScript compilation with `tsc -b` in build process
4. **Build & Test**: `pnpm run build` generates optimized production build in `/dist`
5. **Preview**: `pnpm run preview` serves production build locally for testing
6. **Deploy**: `pnpm run deploy` builds and pushes to `gh-pages` branch automatically
7. **Live Sites**: 
   - GitHub Pages: `https://cloudcodetree.github.io/`
   - Custom Domain: `https://cloudcodetree.com/`
8. **DNS Management**: Route53 handles custom domain with A/CNAME records
9. **Content Updates**: Add blog posts via markdown files, update project data in components

## SPA (Single Page Application) Support

- **GitHub Pages SPA**: `404.html` redirects to `index.html` for client-side routing
- **React Router v7**: Latest router with enhanced performance and features
- **Deep Linking**: All routes (`/`, `/resume`, `/projects`, `/blog`, `/contact`, `/schedule`) work with direct access
- **SEO Optimization**: React Helmet Async provides dynamic meta tags and titles
- **Page Titles**: Format: `{Page Name} | Chris Harper` or fallback to full name
- **Meta Descriptions**: Each page has appropriate meta description for search engines
- **Open Graph**: Ready for social media meta tag implementation

## Navigation Structure

**Current Active Routes**:
- `/` - HomePage (Hero, Skills, Services)
- `/resume` - ResumePage (Interactive resume with multiple format downloads)
- `/contact` - ContactPage (Contact form and professional info)  
- `/schedule` - SchedulePage (Calendly integration)

**Available but Commented Out**:
- `/projects` - ProjectsPage (Fully implemented but not in nav)
- `/blog` - BlogPage (Fully implemented but not in nav)

**Note**: Projects and Blog pages are complete and functional but currently commented out in the navigation (`Layout.tsx` lines 40-41, 23-24). Uncomment to enable.

## Blog ("AI News")

The blog is labeled **AI News** in the nav and masthead (route stays `/blog`). It's
**static markdown**: `public/blog/posts.json` is the newest-first index; each entry points
at a `public/blog/<id>.md` file. The list (`/blog`, `app/components/BlogPage.tsx`) fetches
the JSON then each `.md`, renders it raw via `react-markdown` + `remark-gfm`, and shows a
paginated full-content feed (10/page; page kept in the URL as `?page=N`). Each post title
links to its own route `/blog/<id>` (`app/blog/[id]/page.tsx` → `BlogPost`), so the browser
back button returns to the list at the right page. Shared types/styling live in
`app/components/blogShared.ts`. All `/blog/<id>` pages are pre-rendered via
`generateStaticParams` (required for `output: 'export'`) — re-export after adding posts.

**Hard rules**
- Published `.md` files have **no YAML frontmatter** (it would render as literal text).
  All metadata lives in `posts.json`.
- Dates are `MM-DD-YYYY`. Posts are newest-first.
- `id` == filename stem == `posts.json` `id`.
- `posts.json` entry schema: `id, title, excerpt, author, date, tags[], readTime, filename`
  plus optional `eyebrow` / `dek` (presentation).
- **Never hand-edit `posts.json`** — go through the scripts below.

**Primary source — the "AI Developer News" briefings (per-item posts).**
The Claude Desktop "AI Developer News" project produces daily `YYYY-MM-DD-ai-briefing.md`
digests. Each digest groups items under three sections (Workflow / Strategy / News). On
the blog, **each item becomes its own post** — the "AI Developer Briefing — <date>"
wrapper is just the internal digest format. Explode + (re)publish them with:
```bash
node scripts/import-briefings.mjs "~/Documents/Claude/Projects/AI Developer News" [--commit]
```
This is idempotent: it rebuilds all briefing-derived posts on each run (and preserves
any hand-written posts you add later). Item title = the bold lead-in; body = the item
prose + a Sources footer; `eyebrow` = the section. No LLM, no web fetch, no synthesis —
every source link is preserved verbatim. The blog currently contains only these
individual briefing items.

**Manual / one-off posts** — drop a `.md` (optionally with frontmatter) and run
`node scripts/publish-post.mjs <file> --commit`, or `--intake ~/Downloads/cct-blog-drafts`,
or the `/publish-post` command.

**Local auto-publish (optional)** — `scripts/sync-briefings.sh` runs the importer, then
commits & pushes to `main` (triggering the deploy). It runs **locally**, not in GitHub
Actions, because the briefings live in a folder on this Mac that the cloud runner can't
see. Schedule it daily with `scripts/com.cloudcodetree.blog-sync.plist` (launchd):
```bash
cp scripts/com.cloudcodetree.blog-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.cloudcodetree.blog-sync.plist   # disable: launchctl unload …
```
(The LLM daily generator and the weekly roundup were removed.)

Validate anytime with `node scripts/validate-blog.mjs` (CI and a hook run this too).

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