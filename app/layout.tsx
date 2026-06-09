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

export const metadata: Metadata = {
  title: 'Chris Harper | Principal Software Engineering Manager',
  description: 'Principal Software Engineering Manager with extensive experience leading enterprise teams and cloud architecture initiatives.',
  openGraph: {
    title: 'Chris Harper | Principal Software Engineering Manager',
    description: 'Principal Software Engineering Manager with extensive experience leading enterprise teams and cloud architecture initiatives.',
    url: 'https://cloudcodetree.com',
    siteName: 'CloudCodeTree',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chris Harper | Principal Software Engineering Manager',
    description: 'Principal Software Engineering Manager with extensive experience leading enterprise teams and cloud architecture initiatives.',
  },
  alternates: {
    types: { 'application/rss+xml': 'https://cloudcodetree.com/feed.xml' },
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