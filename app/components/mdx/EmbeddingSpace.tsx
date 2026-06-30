'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of embeddings (Embedding-Projector / t-SNE style): each
 * product becomes a point, and *similar meaning lands nearby* — camping gear
 * clusters together, unrelated electronics sit far away. A free-text query is
 * embedded too and drops next to the gear it means, with a dashed line to its
 * nearest neighbor. This is exactly what powers semantic search in a later part.
 *
 * Points fade in; the query slides in last and its nearest neighbors ring-pulse.
 * Positions are a hand-laid 2D projection (illustrative). Static-safe: labels are
 * real text, final positions render with no JS.
 */

type Pt = { label: string; x: number; y: number; group: 'gear' | 'other' | 'query' };

const POINTS: Pt[] = [
  { label: 'Tent', x: 30, y: 30, group: 'gear' },
  { label: 'Sleeping bag', x: 20, y: 48, group: 'gear' },
  { label: 'Backpack', x: 38, y: 56, group: 'gear' },
  { label: 'Trekking poles', x: 46, y: 38, group: 'gear' },
  { label: 'Headphones', x: 78, y: 66, group: 'other' },
  { label: 'Blender', x: 86, y: 50, group: 'other' },
  { label: 'Monitor', x: 72, y: 40, group: 'other' },
];

const QUERY: Pt = { label: '"lightweight shelter for backpacking"', x: 30, y: 42, group: 'query' };

const COLOR = { gear: '#3fb950', other: '#8b98a8', query: ACCENT } as const;

export default function EmbeddingSpace({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        Similar meaning → nearby vectors
      </div>

      <div style={{ position: 'relative', height: 240, border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, background: 'rgba(148,163,184,0.03)', overflow: 'hidden' }}>
        {/* dashed line: query → nearest neighbor (Tent) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <motion.line
            x1={`${QUERY.x}%`} y1={`${QUERY.y}%`} x2={`${POINTS[0].x}%`} y2={`${POINTS[0].y}%`}
            stroke={accent} strokeWidth={1.5} strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 0.7 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 1, duration: 0.6 }}
          />
        </svg>

        {/* product points */}
        {POINTS.map((p, i) => (
          <motion.div
            key={p.label}
            style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 6 }}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span style={{ position: 'relative', width: 10, height: 10 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: COLOR[p.group] }} />
              {p.group === 'gear' && (
                <motion.span
                  style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1.5px solid ${accent}` }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: [0, 0.9, 0], scale: [0.6, 1.6, 2] }}
                  viewport={{ amount: 0.4 }}
                  transition={{ delay: 1.2 + i * 0.15, duration: 1.4, repeat: Infinity, repeatDelay: 1.5 }}
                />
              )}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: p.group === 'other' ? '#8b98a8' : '#cdd7e2', whiteSpace: 'nowrap' }}>{p.label}</span>
          </motion.div>
        ))}

        {/* the embedded query */}
        <motion.div
          style={{ position: 'absolute', left: `${QUERY.x}%`, top: `${QUERY.y}%`, transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 6 }}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.4 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.span
            style={{ width: 13, height: 13, borderRadius: '50%', background: accent, border: '2px solid #fff', display: 'block' }}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span style={{ fontFamily: MONO, fontSize: 11, color: accent, fontWeight: 700, whiteSpace: 'nowrap', background: 'rgba(13,17,23,0.7)', padding: '1px 4px', borderRadius: 4 }}>
            {QUERY.label}
          </span>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap', fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>
        <span><span style={{ color: '#3fb950' }}>●</span> camping gear (close)</span>
        <span><span style={{ color: '#8b98a8' }}>●</span> unrelated (far)</span>
        <span><span style={{ color: accent }}>●</span> query — lands by what it <em>means</em>, not words it shares</span>
      </div>
    </div>
  );
}
