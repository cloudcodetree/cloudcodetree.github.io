// Single source of truth for the Projects gallery — hand-maintained, same
// philosophy as app/tutorials/manifest.ts. Scripts read it via
// scripts/lib/projects-data.mjs (regex parse of these object literals), so
// keep entries as flat single-quoted object literals, one per project.
//
// Copy is grounded in each repo's README (fetched 2026-08-21) — do not invent
// capabilities. `repoUrl` is omitted for private repos by design.
// `demo` arrives with Phase 2 (the auth gate); until then `demoStatus:
// 'coming-soon'` marks the pilot, and `externalUrl` links the currently-public
// GitHub Pages deployments (which Phase 3 will retire per the design spec).

export interface Project {
  slug: string;
  title: string;
  summary: string; // 1–2 sentences, card copy
  tech: string[]; // chips
  repoUrl?: string; // omitted for private repos
  externalUrl?: string; // live public deployment, while one exists
  /** Present = the project has a gated demo. `artifact` pins the release tag
   * the deploy vendors into /projects/<slug>/demo/. */
  demo?: {
    status: 'live' | 'coming-soon';
    artifact?: string; /* pinned commit SHA or release tag */
    repo?: string; /* repo name when it differs from the slug */
    strategy?: 'vite' | 'static'; /* default vite */
  };
  cover: string; // committed generated asset under public/projects/covers/
  featured?: boolean;
  order: number;
}

export const projects: Project[] = [
  {
    slug: 'nam-app',
    title: 'NAM Player',
    summary:
      'Cross-platform JUCE app to play guitar through Neural Amp Modeler captures — first-class A2 model support and one-click tone downloads from TONE3000, built on a JUCE-free, unit-tested DSP/net core.',
    tech: ['C++', 'JUCE', 'DSP', 'CMake', 'NeuralAudio'],
    repoUrl: 'https://github.com/cloudcodetree/nam-app',
    cover: '/projects/covers/nam-app.png',
    featured: true,
    order: 1,
  },
  {
    slug: 'motion-expression',
    title: 'Motion → Music',
    summary:
      'Turn interpretive dance into music: body motion becomes sound events, facial emotion colors the timbre. Runs entirely in the browser — no video ever leaves the device.',
    tech: ['TypeScript', 'MediaPipe', 'Tone.js', 'Web Audio'],
    repoUrl: 'https://github.com/cloudcodetree/motion-expression',
    demo: { status: 'live', artifact: '9ac4afa0fc4fbc5dfe1d27bcb347bae8f1a02f6f' },
    cover: '/projects/covers/motion-expression.png',
    featured: true,
    order: 2,
  },
  {
    slug: 'backlot',
    title: 'Backlot',
    summary:
      'A Slack-like chat for fictional character workspaces — each “company” is a complete cast from a show or movie, giving Claude-driven characters a rich visual chat surface.',
    tech: ['React', 'TypeScript', 'SQLite', 'Claude'],
    repoUrl: 'https://github.com/cloudcodetree/backlot',
    demo: { status: 'live', artifact: 'a0b9c4067e9d15756e827ae0740c6a525772264f' },
    cover: '/projects/covers/backlot.png',
    order: 3,
  },
  {
    slug: 'homestead-finder',
    title: 'homestead.deals',
    summary:
      'A homestead-buyer’s research desk: scrapes land listings, scores deals, and serves a dashboard with email alerts — Supabase + Cloudflare Pages with a Mac-mini-hosted Claude bridge.',
    tech: ['Python', 'React', 'Supabase', 'Cloudflare'],
    externalUrl: 'https://homestead.deals',
    cover: '/projects/covers/homestead-finder.png',
    order: 4,
  },
  {
    slug: 'span-calculator',
    title: 'Structural Span Calculator',
    summary:
      'Interactive calculator for allowable spans across residential construction materials — dimensional lumber, LVL, glulam, I-joists, and steel — with a ranked comparison view. NDS/AISC/IRC-based estimates.',
    tech: ['JavaScript', 'Structural Engineering'],
    repoUrl: 'https://github.com/cloudcodetree/span-calculator',
    externalUrl: 'https://cloudcodetree.com/span-calculator/',
    demo: { status: 'live', artifact: '4a1ea8612becaa23a3eb1ac27671ef898650f9ba' },
    cover: '/projects/covers/span-calculator.png',
    order: 5,
  },
  {
    slug: 'mac-desktop-navigator',
    title: 'Desktop Navigator',
    summary:
      'Native macOS menu bar utility for switching Mission Control Spaces, launching Mission Control, and capturing screenshots — one unobtrusive row of icons.',
    tech: ['Swift', 'macOS'],
    repoUrl: 'https://github.com/cloudcodetree/mac-desktop-navigator',
    cover: '/projects/covers/mac-desktop-navigator.png',
    order: 6,
  },
  {
    slug: 'midea-mini-split-tools',
    title: 'Midea Mini-Split Tools',
    summary:
      'Controlling Senville/Midea ceiling-cassette mini-splits from Home Assistant: an ESPHome XYE wired-control bridge plus a working Follow-Me IR fallback, validated on real hardware.',
    tech: ['Python', 'ESPHome', 'Home Assistant', 'IR/RS-485'],
    repoUrl: 'https://github.com/cloudcodetree/midea-mini-split-tools',
    cover: '/projects/covers/midea-mini-split-tools.png',
    order: 7,
  },
  {
    slug: 'code-compare',
    title: 'Code Compare',
    summary:
      'View different programming languages’ syntax side by side — a quick visual reference for how the same construct reads across languages.',
    tech: ['HTML', 'JavaScript'],
    repoUrl: 'https://github.com/cloudcodetree/code_compare',
    demo: { status: 'live', artifact: '5f6ea42db070c78da58365d146e900b37a83a359', repo: 'code_compare', strategy: 'static' },
    cover: '/projects/covers/code-compare.png',
    order: 8,
  },
];
