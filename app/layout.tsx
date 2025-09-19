import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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