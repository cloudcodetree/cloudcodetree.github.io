'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * LabelImbalance — dataset engineering Part 15.
 *
 * Visual metaphor: a **tilted scale** turned into a horizontal stacked bar.
 * Each label occupies its real fraction of the 270-row snapshot so the
 * imbalance is physically obvious (overpriced dominates the right half).
 * Bars grow left-to-right in sequence; the overpriced bar over-reaches and
 * appears to tip the layout — deliberate, not a bug.
 *
 * Real numbers from electronics-2026-07 snapshot (ground-truth, Part 15):
 *   deal=71, fair=40, suspicious=32, overpriced=127  (n=270)
 * Class weights (balanced, n/(n_classes*count)):
 *   deal≈0.9507, fair≈1.6875, suspicious≈2.1094, overpriced≈0.5315
 *
 * Static-export-safe: all data is inline; no runtime fetch; Framer Motion only.
 */

type LabelRow = {
  name: string;
  count: number;
  weight: number;
  color: string;
};

const N = 270;

const ROWS: LabelRow[] = [
  { name: 'deal',       count:  71, weight: 0.9507, color: '#3fb950' },
  { name: 'fair',       count:  40, weight: 1.6875, color: '#58a6ff' },
  { name: 'suspicious', count:  32, weight: 2.1094, color: '#d29922' },
  { name: 'overpriced', count: 127, weight: 0.5315, color: '#8b98a8' },
];

export default function LabelImbalance() {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '20px 18px',
        margin: '24px 0',
        background: 'rgba(13,17,23,0.4)',
      }}
    >
      {/* header */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: ACCENT,
          marginBottom: 4,
        }}
      >
        Label distribution · 270 rows · electronics-2026-07
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          marginBottom: 18,
        }}
      >
        overpriced majority (47%) — balanced class weights compensate
      </div>

      {/* stacked proportion bar */}
      <div
        style={{
          display: 'flex',
          height: 24,
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 20,
          background: 'rgba(148,163,184,0.08)',
        }}
      >
        {ROWS.map((r, i) => {
          const pct = (r.count / N) * 100;
          return (
            <motion.div
              key={r.name}
              style={{ background: r.color, height: '100%' }}
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: `${pct}%`, opacity: 0.82 }}
              viewport={{ amount: 0.4 }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: 'easeOut' as const }}
              title={`${r.name}: ${r.count} / ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* per-label rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ROWS.map((r, i) => {
          const pct = (r.count / N) * 100;
          const isOverpriced = r.name === 'overpriced';
          return (
            <div
              key={r.name}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              {/* label name */}
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: r.color,
                  width: 82,
                  flex: '0 0 auto',
                  fontWeight: isOverpriced ? 700 : 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {r.name}
              </div>

              {/* bar track */}
              <div
                style={{ flex: 1, position: 'relative', height: 10, background: 'rgba(148,163,184,0.1)', borderRadius: 4 }}
              >
                <motion.div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    background: r.color,
                    opacity: isOverpriced ? 0.9 : 0.7,
                    borderRadius: 4,
                  }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ amount: 0.4 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: 'easeOut' as const }}
                />
              </div>

              {/* count + fraction + weight */}
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: '#cdd7e2',
                  width: 210,
                  flex: '0 0 auto',
                  textAlign: 'right',
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ color: r.color }}>{r.count}</span>
                <span style={{ color: '#586069' }}>({pct.toFixed(1)}%)</span>
                <span style={{ color: '#8b98a8' }}>
                  w={r.weight.toFixed(4)}
                  {r.name === 'suspicious' && (
                    <span style={{ color: '#d29922' }}> ↑ rarest</span>
                  )}
                  {isOverpriced && (
                    <span style={{ color: '#8b98a8' }}> ↓ majority</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          marginTop: 18,
          flexWrap: 'wrap',
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          paddingTop: 12,
        }}
      >
        <span>n=270 · 4 classes · no resampling</span>
        <span>w = n / (n_classes × count)</span>
        <span style={{ color: '#d29922' }}>suspicious: rarest → largest weight (2.1094)</span>
      </div>
    </div>
  );
}
