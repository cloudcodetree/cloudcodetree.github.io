# CloudCodeTree Portfolio

> Professional portfolio website for Chris Harper - Full Stack Developer & Cloud Solutions Architect

## 🚀 Live Sites

- **Production**: [cloudcodetree.com](https://cloudcodetree.com)
- **GitHub Pages**: [cloudcodetree.github.io](https://cloudcodetree.github.io)

## ✨ Features

- **Modern Tech Stack**: Next.js 15, React 19, TypeScript, Material-UI v7
- **Professional Design**: Dark theme with glass morphism effects and gradient accents
- **Responsive Layout**: Mobile-first design with adaptive navigation
- **Dynamic Content**:
  - GitHub API integration for live repository data
  - External markdown blog system with search and filtering
  - Interactive resume with reCAPTCHA protection
- **Performance Optimized**: Automatic code splitting, static generation, image optimization
- **SEO Ready**: Built-in Next.js metadata API with dynamic meta tags
- **PWA Capabilities**: Service worker and offline functionality
- **Static Export**: Optimized for GitHub Pages deployment

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server locally
pnpm run start

# Lint code
pnpm run lint

# Deploy to GitHub Pages
pnpm run deploy
```

### Development Server

The development server runs at `http://localhost:3000/` with hot reload enabled.

## 📁 Project Structure

```
app/
├── layout.tsx           # Root layout with metadata and providers
├── page.tsx            # Homepage route
├── contact/page.tsx    # Contact page route
├── resume/page.tsx     # Resume page route
├── schedule/page.tsx   # Schedule page route
├── components/         # Reusable UI components
│   ├── ClientLayout.tsx # Client-side navigation and layout
│   ├── ThemeProvider.tsx # MUI theme provider
│   ├── HomePage.tsx     # Landing page with hero and services
│   ├── ResumePage.tsx   # Interactive resume display
│   ├── ContactPage.tsx  # Contact form and info
│   ├── SchedulePage.tsx # Calendly integration
│   ├── ObfuscatedEmail.tsx
│   ├── ResumeContent.tsx
│   └── PrintableResume.tsx
├── lib/                # Utility functions and configurations
│   ├── theme.ts        # MUI theme configuration
│   └── emailObfuscation.ts
├── config/             # Application configuration
│   └── calendly.ts     # Calendly integration config
└── globals.css         # Global styles

public/
├── blog/               # External blog content
│   ├── posts.json     # Blog posts index
│   └── *.md           # Individual blog posts
├── resume/             # Resume assets
└── [PWA files]        # Service worker, robots.txt, etc.
```

## 🎨 Tech Stack

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript
- **UI Framework**: Material-UI (MUI) v7
- **Styling**: Custom dark theme + Tailwind CSS utilities
- **Routing**: Next.js file-based routing
- **Animations**: Framer Motion

### Features & Integrations
- **Blog System**: React Markdown with external file loading
- **GitHub Integration**: REST API for live repository data
- **Contact**: Direct email integration
- **Scheduling**: Calendly widget integration
- **SEO**: Next.js built-in metadata API
- **Security**: reCAPTCHA for resume download protection
- **Static Generation**: Optimized static site generation for GitHub Pages

## 🚀 Deployment

### GitHub Pages Setup

This project uses GitHub Pages with a custom domain:

1. **Repository**: `cloudcodetree/cloudcodetree.github.io`
2. **Source**: `gh-pages` branch (auto-generated)
3. **Custom Domain**: `cloudcodetree.com`
4. **DNS**: Route53 with A records pointing to GitHub Pages

### Deployment Commands

```bash
# Build and deploy to gh-pages branch
pnpm run deploy

# Manual build only
pnpm run build
```

The deployment process:
1. Runs `pnpm run build` to generate static export in `/out`
2. Pushes `/out` contents to `gh-pages` branch
3. GitHub Pages serves the site automatically

### DNS Configuration

**A Records for cloudcodetree.com:**
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

**CNAME Record:**
- www.cloudcodetree.com → cloudcodetree.github.io

## 🔄 Migration to Next.js

This project was successfully migrated from Vite + React Router to Next.js 15 with App Router:

### Key Changes
- **Framework**: Migrated from Vite to Next.js 15 with App Router
- **Routing**: Converted from React Router to file-based routing
- **Build Output**: Changed from `/dist` to `/out` for static export
- **SEO**: Replaced React Helmet with Next.js metadata API
- **Theme**: Moved MUI theme provider to client component for better compatibility
- **Performance**: Gained automatic code splitting and static generation

### Benefits Achieved
- ✅ **Better SEO**: Server-side rendering and static generation
- ✅ **Improved Performance**: Automatic optimizations and code splitting
- ✅ **Modern Architecture**: Latest Next.js features and best practices
- ✅ **Enhanced DX**: Better development experience with improved tooling
- ✅ **Future-Ready**: Easy scaling for server-side features if needed

## 📝 Content Management

### Blog Posts

Add new blog posts by:
1. Creating markdown files in `/public/blog/`
2. Updating `/public/blog/posts.json` with post metadata
3. Posts support full markdown with syntax highlighting

### Projects

- **Featured Projects**: Update the `featuredProjects` array in `ProjectsPage.tsx`
- **GitHub Repos**: Automatically fetched from GitHub API (username: cloudcodetree)

### Resume

- PDF stored in `/public/resume.pdf`
- Protected by reCAPTCHA verification
- Markdown version in `/public/resume/chris_harper-resume.md`

## 🔒 Security

- reCAPTCHA protection for sensitive downloads
- Email obfuscation utilities
- All external links use `rel="noopener noreferrer"`
- HTTPS enforced on both domains
- No sensitive API keys in client code

## 🌐 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: ES2020+ features
- **CSS**: Grid, Flexbox, CSS variables, backdrop-filter
- **Mobile**: iOS 14+, Android Chrome 90+

## 📄 License

This project is the personal portfolio of Chris Harper. All rights reserved.

## 🤝 Contributing

This is a personal portfolio project. For business inquiries or collaboration opportunities, please contact:

- **Email**: chris@cloudcodetree.com
- **Website**: [cloudcodetree.com](https://cloudcodetree.com)
- **Schedule**: [calendly.com/cloudcodetree](https://calendly.com/cloudcodetree)