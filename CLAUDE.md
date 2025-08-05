# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern portfolio website built with React, TypeScript, Vite, and deployed to GitHub Pages. It showcases a professional developer portfolio with the following features:

- **Dark Professional Theme**: Uses Material-UI with custom dark theme and Tailwind CSS
- **Resume Section**: Interactive resume with human verification (reCAPTCHA) before PDF download
- **Project Display**: Integrates with GitHub API to display repositories dynamically
- **Static Blog**: Markdown-based blog system with search and filtering
- **Contact Form**: EmailJS integration for sending emails to chris@cloudcodetree.com
- **Interview Scheduling**: Calendly integration for booking appointments
- **Responsive Design**: Mobile-first design using CSS Grid, Flexbox, and modern CSS features

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
- **UI Library**: Material-UI (MUI) v7 with custom dark theme
- **CSS**: Tailwind CSS v4 with custom configuration
- **Routing**: React Router v7
- **Animation**: Framer Motion
- **Markdown**: React Markdown with remark-gfm
- **Forms**: EmailJS for contact form functionality
- **Deployment**: GitHub Pages with GitHub Actions

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
- Replace 'cloudcodetree' with actual GitHub username
- No authentication required for public repos

**EmailJS Configuration**:
- Service ID, Template ID, and Public Key need to be configured
- Replace placeholder values in ContactPage.tsx
- Sends emails to chris@cloudcodetree.com

**reCAPTCHA**: 
- Test site key used (6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI)
- Replace with production site key for real deployment

**Calendly Integration**:
- Replace placeholder URL 'https://calendly.com/cloudcodetree/consultation'
- Supports both embedded widget and popup modal

## Deployment

### GitHub Pages Setup
1. Repository must be named exactly 'gh-pages' or update vite.config.ts base path
2. Enable GitHub Pages in repository settings
3. GitHub Actions workflow automatically deploys on push to main branch
4. Site will be available at: `https://[username].github.io/gh-pages/`

### Environment Variables
For production deployment, configure:
- EmailJS Service ID, Template ID, Public Key
- reCAPTCHA site key (production)
- Calendly URL
- GitHub username for API calls

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
- Update GitHub username in ProjectsPage.tsx
- Featured projects are manually curated
- Real repositories are fetched from GitHub API

## Performance Considerations

- Uses React.lazy for code splitting (can be implemented for pages)
- Images should be optimized and stored in public/assets/
- Consider implementing service worker for offline functionality
- Bundle size is optimized with tree shaking

## Security Notes

- reCAPTCHA protects resume download from bots
- EmailJS prevents email spam and protects backend
- No sensitive API keys exposed in client code
- All external links use rel="noopener noreferrer"

## Browser Support

- Modern browsers with ES2020+ support
- CSS Grid and Flexbox required
- backdrop-filter requires recent browser versions