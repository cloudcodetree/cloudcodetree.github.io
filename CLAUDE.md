# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is CloudCodeTree's professional portfolio website built with React, TypeScript, Vite, and deployed to GitHub Pages. It showcases a modern developer portfolio with the following features:

- **Dark Professional Theme**: Uses Material-UI v6 with custom dark theme, glass morphism effects, and gradient accents
- **Hero Landing Page**: Professional intro with avatar, skills showcase, and service offerings
- **Resume Section**: Interactive resume with reCAPTCHA verification and printable PDF download
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

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Lint code
pnpm run lint

# Deploy to GitHub Pages
pnpm run deploy
```

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **UI Library**: Material-UI (MUI) v6 with custom dark theme
- **CSS**: Tailwind CSS v3 with custom configuration
- **Routing**: React Router v7
- **Animation**: Framer Motion
- **Markdown**: React Markdown with remark-gfm
- **Forms**: EmailJS for contact form functionality
- **Deployment**: GitHub Pages with gh-pages package
- **Domain**: Route53 DNS + GitHub Pages custom domain

### Project Structure
```
src/
├── components/               # Reusable UI components
│   ├── Layout.tsx           # Main layout with responsive navigation
│   ├── ObfuscatedEmail.tsx  # Email obfuscation component
│   └── PrintableResume.tsx  # Printable resume component
├── pages/                   # Page components (SPA routes)
│   ├── HomePage.tsx         # Hero landing with services and skills
│   ├── ResumePage.tsx       # Resume display with multiple format downloads and one-time verification
│   ├── ProjectsPage.tsx     # Featured projects + GitHub API integration
│   ├── BlogPage.tsx         # Dynamic blog with external markdown loading
│   ├── ContactPage.tsx      # Contact form and professional info
│   └── SchedulePage.tsx     # Calendly scheduling integration
├── utils/                   # Utility functions
│   └── emailObfuscation.ts  # Email security utilities
├── hooks/                   # Custom React hooks (empty, ready for expansion)
├── data/                    # Static data (empty, ready for expansion)
└── assets/                  # Static assets (React logo, etc.)

public/
├── blog/                    # External blog content
│   ├── posts.json          # Blog posts index
│   └── *.md                 # Individual blog post markdown files
├── resume/                  # Resume assets
│   └── chris-harper-resume.md
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