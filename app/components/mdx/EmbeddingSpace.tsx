'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of embeddings (Embedding-Projector / t-SNE style): each
 * product becomes a point, and *similar meaning lands nearby* — noise-cancelling
 * headphones cluster together, unrelated categories sit far away. A free-text query
 * is embedded too and drops next to the products it means, with a dashed line to
 * its nearest neighbor. This is exactly what powers semantic search in Part 5.
 *
 * Points fade in; the query slides in last and its nearest neighbors ring-pulse.
 * Positions are a hand-laid 2D projection (illustrative). Static-safe: labels are
 * real text, final positions render with no JS.
 *
 * Hero cast: Sony WH-1000XM5 ($162.97 — the median anchor), Anker Q20i ($44.99 —
 * honest deal), Bose QC45 ($46 — suspicious trap), Sony XM6 ($399.99 — overpriced).
 * All sit close in embedding space because they share category/use-case semantics —
 * embeddings capture "what it is", not "is it priced fairly". That's why the deal
 * scorer (Part 3) is a separate signal.
 */

type Pt = { label: string; x: number; y: number; group: 'audio' | 'other' | 'query' };

const POINTS: Pt[] = [
  { label: 'Sony WH-1000XM5', x: 28, y: 34, group: 'audio' },
  { label: 'Bose QC45', x: 36, y: 26, group: 'audio' },
  { label: 'Anker Q20i', x: 22, y: 50, group: 'audio' },
  { label: 'Sony XM6', x: 40, y: 42, group: 'audio' },
  { label: 'MacBook Air', x: 74, y: 36, group: 'other' },
  { label: 'Dell Monitor', x: 82, y: 58, group: 'other' },
  { label: 'Anker USB-C Hub', x: 68, y: 62, group: 'other' },
];

const QUERY: Pt = { label: '"noise cancelling headphones"', x: 30, y: 42, group: 'query' };

const COLOR = { audio: '#94bce3', other: '#8b98a8', query: ACCENT } as const;

export default function EmbeddingSpace({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        Similar meaning → nearby vectors
      </div>

      <div style={{ position: 'relative', height: 240, border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, background: 'rgba(148,163,184,0.03)', overflow: 'hidden' }}>
        {/* dashed line: query → nearest neighbor (headphones) */}
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
              {p.group === 'audio' && (
                <motion.span
                  style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1.5px solid ${accent}` }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: [0, 0.9, 0], scale: [0.6, 1.6, 2] }}
                  viewport={{ amount: 0.4 }}
                  transition={{ delay: 1.2 + i * 0.15, duration: 1.4, repeat: Infinity, repeatDelay: 1.5 }}
                />
              )}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: p.group === 'other' ? '#8b98a8' : '#cdd7e2', whiteSpace: 'nowrap' }}>{p.label}</span>
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
        <span><span style={{ color: '#94bce3' }}>●</span> headphones (clustered — same semantics)</span>
        <span><span style={{ color: '#8b98a8' }}>●</span> other categories (far)</span>
        <span><span style={{ color: accent }}>●</span> query — lands near the right cluster by <em>meaning</em></span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 8 }}>
        Note: all four headphones sit close — embeddings capture <em>what it is</em>, not <em>is it priced fairly</em>. The Bose QC45 trap at $46 and the genuine Anker deal at $44.99 are neighbors here. That&apos;s why Part 3&apos;s deal scorer is a separate signal.
      </div>
    </div>
  );
}
