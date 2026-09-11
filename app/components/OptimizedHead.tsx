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

      {children}
    </>
  )
}

export default OptimizedHead