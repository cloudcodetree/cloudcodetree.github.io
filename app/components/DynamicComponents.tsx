import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Lazy load heavy components with loading states
export const DynamicContactPage = dynamic(
  () => import('./ContactPage'),
  {
    loading: () => (
      <div style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    ),
    ssr: true
  }
);

export const DynamicSchedulePage = dynamic(
  () => import('./SchedulePage'),
  {
    loading: () => (
      <div style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    ),
    ssr: true
  }
);

export const DynamicResumePage = dynamic(
  () => import('./ResumePage'),
  {
    loading: () => (
      <div style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    ),
    ssr: true
  }
);