import type { Metadata } from 'next'
import { Inter, Fraunces, IBM_Plex_Mono } from 'next/font/google'
import ClientOnlyThemeProvider from './components/ClientOnlyThemeProvider'
import OptimizedHead from './components/OptimizedHead'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700']
})

// Editorial display serif for the blog ("The Brief") headlines.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT'],
  style: ['normal', 'italic'],
})

// Developer mono for kickers, dates, and metadata.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
})

// Site-wide default metadata = the AI News brand. This is the fallback Open
// Graph/title for any shared link, so it must NOT carry a personal title — keep
// the focus on the blog. Per-article pages override with their own title/image.
export const metadata: Metadata = {
  metadataBase: new URL('https://cloudcodetree.com'),
  title: 'AI News · CloudCodeTree',
  description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, developer workflow, and the custom-model stack.',
  openGraph: {
    title: 'AI News · CloudCodeTree',
    description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, developer workflow, and the custom-model stack.',
    url: 'https://cloudcodetree.com',
    siteName: 'CloudCodeTree',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI News · CloudCodeTree',
    description: 'Daily field notes on AI-assisted engineering — model releases, agent tooling, developer workflow, and the custom-model stack.',
  },
  alternates: {
    types: { 'application/rss+xml': 'https://cloudcodetree.com/feed.xml' },
  },
  // Browser-tab icon = the actual brand mark from the header (SVG, with a PNG
  // fallback). Replaces the old generated "CH" icon.
  icons: {
    icon: [
      { url: '/Fav_Icon.svg', type: 'image/svg+xml' },
      { url: '/Fav_Icon_32.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/Fav_Icon.svg',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexMono.variable}`}>
      <head>
        <OptimizedHead />
      </head>
      <body className={inter.className}>
        <ClientOnlyThemeProvider>
          <div className="min-h-screen bg-dark-950 text-dark-50 critical-css">
            {children}
          </div>
        </ClientOnlyThemeProvider>
      </body>
    </html>
  )
}