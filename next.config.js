/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  // Let .mdx files under app/ be pages (hand-authored tutorials).
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cloudcodetree.com' : '',
  basePath: '',
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize development builds
      config.optimization.splitChunks = false;
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
}

const createMDX = require('@next/mdx').default ?? require('@next/mdx');
// NB: Syntax highlighting is done via a Shiki server component (app/components/mdx/
// CodeBlock.tsx, wired as the `pre` override in mdx-components.tsx), NOT a rehype
// plugin — Turbopack (dev --turbo) can't serialize MDX plugin options. The component
// highlights at build time, so it stays static-export-safe with zero runtime JS.
const withMDX = createMDX({
  extension: /\.mdx?$/,
  // GFM so markdown tables/strikethrough/task-lists render (string form for
  // Turbopack serialization). Syntax highlighting stays a component (see above).
  options: { remarkPlugins: [['remark-gfm']] },
});

module.exports = withMDX(nextConfig);
