'use client';

import { useEffect } from 'react';

/**
 * Client-side redirect stub for static export (GitHub Pages has no server).
 * Used by the legacy /blog routes to forward to their /ai-news equivalents.
 * The server page sets a canonical + noindex; this performs the actual hop.
 */
export default function Redirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <p style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#cbd5e1' }}>
      This page has moved to <a href={to} style={{ color: '#2f81f7' }}>{to}</a>…
    </p>
  );
}
