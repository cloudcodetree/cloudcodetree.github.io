'use client';

import { MONO, ACCENT } from '../blogShared';

/**
 * LessonScreenshot — a real capture from the running app, framed with a
 * caption and an explicit "look for" strip so the learner knows exactly what
 * expected state looks like. Course rule: screenshots are always genuine
 * captures (never mockups), stored under /tutorials/screens/<slug>/, with the
 * relevant UI highlighted at capture time.
 */

export default function LessonScreenshot({
  src,
  alt,
  caption,
  lookFor,
  accent = ACCENT,
}: {
  src: string;
  alt: string;
  caption?: string;
  lookFor?: string;
  accent?: string;
}) {
  return (
    <figure style={{ margin: '24px 0' }}>
      <div style={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: 12, overflow: 'hidden', background: '#0d1117' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export; real capture at native size */}
        <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto' }} loading="lazy" />
      </div>
      {lookFor && (
        <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.6, marginTop: 8, padding: '8px 12px', borderLeft: `3px solid ${accent}`, background: 'rgba(59,130,246,0.06)', borderRadius: '0 8px 8px 0', color: '#cdd7e2' }}>
        <b style={{ color: accent }}>Look for:</b> {lookFor}
        </div>
      )}
      {caption && (
        <figcaption style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 6, textAlign: 'center' }}>{caption}</figcaption>
      )}
    </figure>
  );
}
