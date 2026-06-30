'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of structured extraction: spans of a messy free-text
 * listing are pulled into typed fields. Each source span is colour-coded and the
 * matching field lights up in the same colour, so "prose → typed JSON" is
 * literal. Static-safe (all text real).
 */

// the listing, segmented; highlighted spans carry a field colour
const SEGMENTS: { t: string; field?: string; color?: string }[] = [
  { t: 'TrailLite', field: 'brand', color: '#2f81f7' },
  { t: ' UL2 — ultralight ' },
  { t: '2-person', field: 'capacity', color: '#3fb950' },
  { t: ' tent, just ' },
  { t: '1.1kg', field: 'weight_kg', color: '#d29922' },
  { t: ', ' },
  { t: '3-season', field: 'season', color: '#a371f7' },
];

const FIELDS = [
  { k: 'brand', v: '"TrailLite"', color: '#2f81f7' },
  { k: 'capacity', v: '2', color: '#3fb950' },
  { k: 'weight_kg', v: '1.1', color: '#d29922' },
  { k: 'season', v: '3', color: '#a371f7' },
];

export default function ExtractFlow({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Messy text → typed JSON
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* the listing with highlighted spans */}
        <div style={{ flex: '1 1 240px', minWidth: 230, fontFamily: MONO, fontSize: 13, lineHeight: 1.9, color: '#8b98a8' }}>
          {SEGMENTS.map((s, i) =>
            s.field ? (
              <motion.span
                key={i}
                style={{ color: '#fff', background: `${s.color}22`, border: `1px solid ${s.color}73`, borderRadius: 5, padding: '2px 5px', whiteSpace: 'nowrap' }}
                initial={{ opacity: 0.3 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12 }}
              >{s.t}</motion.span>
            ) : (
              <span key={i}>{s.t}</span>
            ),
          )}
        </div>

        <motion.div style={{ color: accent, fontFamily: MONO, fontSize: 18, flex: '0 0 auto' }} animate={{ x: [-2, 3, -2], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}>→</motion.div>

        {/* typed fields */}
        <div style={{ flex: '1 1 200px', minWidth: 200, fontFamily: MONO, fontSize: 12, border: `1px solid ${accent}40`, borderRadius: 10, padding: '12px 14px', background: 'rgba(148,163,184,0.04)' }}>
          <div style={{ color: '#8b98a8' }}>ListingSpecs {'{'}</div>
          {FIELDS.map((f, i) => (
            <motion.div
              key={f.k}
              style={{ paddingLeft: 14 }}
              initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.6 + i * 0.15 }}
            >
              <span style={{ color: '#8b98a8' }}>{f.k}:</span> <span style={{ color: f.color, fontWeight: 700 }}>{f.v}</span>
            </motion.div>
          ))}
          <div style={{ color: '#8b98a8' }}>{'}'}</div>
        </div>
      </div>
    </div>
  );
}
