import { FC } from 'react'

interface OptimizedHeadProps {
  children?: React.ReactNode
}

const OptimizedHead: FC<OptimizedHeadProps> = ({ children }) => {
  return (
    <>
      {/* Emotion insertion point for MUI styles */}
      <meta name="emotion-insertion-point" content="" />

      {/* Favicon links */}
      <link rel="icon" href="/icon" sizes="32x32" type="image/png" />
      <link rel="apple-touch-icon" href="/apple-icon" sizes="180x180" type="image/png" />

      {/* DNS prefetch for external domains */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />

      {/* Preconnect to critical domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Viewport meta tag for responsive design */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {children}
    </>
  )
}

export default OptimizedHead