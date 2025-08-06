# CloudCodeTree Portfolio

> Professional portfolio website for Chris Harper - Full Stack Developer & Cloud Solutions Architect

## 🚀 Live Sites

- **Production**: [cloudcodetree.com](https://cloudcodetree.com)
- **GitHub Pages**: [cloudcodetree.github.io](https://cloudcodetree.github.io)

## ✨ Features

- **Modern Tech Stack**: React 19, TypeScript, Material-UI v6, Vite
- **Professional Design**: Dark theme with glass morphism effects and gradient accents
- **Responsive Layout**: Mobile-first design with adaptive navigation
- **Dynamic Content**: 
  - GitHub API integration for live repository data
  - External markdown blog system with search and filtering
  - Interactive resume with reCAPTCHA protection
- **Performance Optimized**: Code splitting, lazy loading, tree shaking
- **SEO Ready**: Dynamic meta tags with React Helmet
- **PWA Capabilities**: Service worker and offline functionality

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

# Preview production build
pnpm run preview

# Lint code
pnpm run lint

# Deploy to GitHub Pages
pnpm run deploy
```

### Development Server

The development server runs at `http://localhost:5173/` with hot reload enabled.

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Layout.tsx       # Main app layout with navigation
│   ├── ObfuscatedEmail.tsx
│   └── PrintableResume.tsx
├── pages/               # SPA route components
│   ├── HomePage.tsx     # Landing page with hero and services
│   ├── ResumePage.tsx   # Interactive resume display
│   ├── ProjectsPage.tsx # GitHub projects showcase
│   ├── BlogPage.tsx     # Dynamic blog system
│   ├── ContactPage.tsx  # Contact form and info
│   └── SchedulePage.tsx # Calendly integration
├── utils/               # Utility functions
└── assets/              # Static assets

public/
├── blog/                # External blog content
│   ├── posts.json      # Blog posts index
│   └── *.md            # Individual blog posts
├── resume/              # Resume assets
└── [PWA files]         # Service worker, robots.txt, etc.
```

## 🎨 Tech Stack

### Core Technologies
- **Frontend**: React 19, TypeScript, Vite
- **UI Framework**: Material-UI (MUI) v6
- **Styling**: Custom dark theme + Tailwind CSS utilities
- **Routing**: React Router v7
- **Animations**: Framer Motion

### Features & Integrations
- **Blog System**: React Markdown with external file loading
- **GitHub Integration**: REST API for live repository data
- **Contact**: Direct email integration
- **Scheduling**: Calendly widget integration
- **SEO**: React Helmet Async for meta management
- **Security**: reCAPTCHA for resume download protection

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
1. Runs `pnpm run build` to generate `/dist`
2. Pushes `/dist` contents to `gh-pages` branch
3. GitHub Pages serves the site automatically

### DNS Configuration

**A Records for cloudcodetree.com:**
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

**CNAME Record:**
- www.cloudcodetree.com → cloudcodetree.github.io

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
- Markdown version in `/public/resume/chris-harper-resume.md`

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