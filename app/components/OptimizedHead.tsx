import { FC } from 'react'

interface OptimizedHeadProps {
  children?: React.ReactNode
}

const OptimizedHead: FC<OptimizedHeadProps> = ({ children }) => {
  return (
    <>
      {/* Emotion insertion point for MUI styles */}
      <meta name="emotion-insertion-point" content="" />

      {/* Favicon links are provided by metadata.icons in app/layout.tsx */}

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