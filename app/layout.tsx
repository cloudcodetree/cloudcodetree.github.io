import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google'
import ClientOnlyThemeProvider from './components/ClientOnlyThemeProvider'
import OptimizedHead from './components/OptimizedHead'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
})

// Industry display face — condensed technical headings (see design/claude-design).
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '600'],
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
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable}`}>
      <head>
        <OptimizedHead />
      </head>
      <body className={barlow.className}>
        <ClientOnlyThemeProvider>
          <div className="min-h-screen bg-dark-950 text-dark-50 critical-css">
            {children}
          </div>
        </ClientOnlyThemeProvider>
      </body>
    </html>
  )
}