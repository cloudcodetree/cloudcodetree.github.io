# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is CloudCodeTree's professional portfolio website built with React, TypeScript, Vite, and deployed to GitHub Pages. It showcases a modern developer portfolio with the following features:

- **Dark Professional Theme**: Uses Material-UI with custom dark theme and Tailwind CSS
- **Resume Section**: Interactive resume with human verification (reCAPTCHA) before PDF download
- **Project Display**: Integrates with GitHub API to display repositories dynamically
- **Static Blog**: Markdown-based blog system with search and filtering
- **Contact Form**: EmailJS integration for sending emails to chris@cloudcodetree.com
- **Interview Scheduling**: Calendly integration (https://calendly.com/cloudcodetree)
- **Responsive Design**: Mobile-first design using CSS Grid, Flexbox, and modern CSS features
- **Custom Domain**: Configured for cloudcodetree.com with Route53 DNS

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
├── components/     # Reusable UI components
│   └── Layout.tsx  # Main layout with navigation and routing
├── pages/          # Page components
│   ├── HomePage.tsx      # Landing page with hero and services
│   ├── ResumePage.tsx    # Resume display with verification
│   ├── ProjectsPage.tsx  # GitHub repos and featured projects
│   ├── BlogPage.tsx      # Static blog with markdown content
│   ├── ContactPage.tsx   # Contact form with EmailJS
│   └── SchedulePage.tsx  # Calendly integration
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── data/           # Static data and content
```

### Key Components

**Layout.tsx**: Main application shell with:
- Responsive navigation (drawer on mobile, horizontal on desktop)
- Route-based page transitions with Framer Motion
- SEO optimization with React Helmet

**Theme Configuration**: 
- Dark theme using CSS custom properties and MUI theme
- Glass morphism effects with backdrop-filter
- Responsive typography and spacing

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
- Static blog posts are defined in `src/pages/BlogPage.tsx`
- Each post includes: title, excerpt, content (markdown), author, date, tags, readTime
- For dynamic blog, consider integrating with a headless CMS or markdown files

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

- Uses React.lazy for code splitting (can be implemented for pages)
- Images should be optimized and stored in public/assets/
- Consider implementing service worker for offline functionality
- Bundle size is optimized with tree shaking
- Current bundle size: ~828KB (warning suggests code splitting)

## Security Notes

- reCAPTCHA protects resume download from bots
- EmailJS prevents email spam and protects backend
- No sensitive API keys exposed in client code
- All external links use rel="noopener noreferrer"
- HTTPS enforced on both GitHub Pages and custom domain

## Browser Support

- Modern browsers with ES2020+ support
- CSS Grid and Flexbox required
- backdrop-filter requires recent browser versions

## Development Workflow

1. **Local Development**: `pnpm run dev` serves at `http://localhost:5173/`
2. **Code Changes**: Make changes on `main` branch
3. **Build & Test**: `pnpm run build` to verify production build
4. **Deploy**: `pnpm run deploy` pushes to `gh-pages` branch
5. **Live Site**: Changes appear at both GitHub Pages and custom domain URLs
6. **DNS**: Route53 handles custom domain routing to GitHub Pages

## SPA (Single Page Application) Support

- **404.html**: Handles direct URL access and page refreshes
- **Client-side Routing**: React Router manages navigation
- **Deep Links**: All routes work with direct URL access
- **SEO**: React Helmet provides meta tags for each page