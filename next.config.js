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
const withMDX = createMDX({ extension: /\.mdx?$/ });

module.exports = withMDX(nextConfig);
