'use client';

import { motion } from 'framer-motion';
import { MONO } from '../blogShared';

/**
 * BoostingLift — bespoke animation for Part 17 (ML & DL breadth).
 *
 * Metaphor: a "lift" chart. Each column represents one experimental setting
 * (linear / GBDT hand-only / GBDT + embeddings). Bars grow from the bottom;
 * height encodes MAE (tall = bad, short = good). An animated bracket highlights
 * the 39% cut between linear and the GBDT+embeddings winner.
 *
 * Numbers are REAL: pinned from gbdt_vs_linear() on electronics-2026-07.json,
 * seed=0, test_frac=0.25, GradientBoostingRegressor (sklearn, NOT xgboost).
 * Full-corpus 202-train / 68-test split.
 */

type Bar = {
  label: string;
  sublabel: string;
  mae: number;       // dollars — real number
  color: string;
  highlight?: boolean;
};

const BARS: Bar[] = [
  {
    label: 'Linear',
    sublabel: 'hand features',
    mae: 227.89,
    color: 'rgba(148,163,184,0.35)',
  },
  {
    label: 'GBDT',
    sublabel: 'hand only',
    mae: 257.99,
    color: 'rgba(201,140,70,0.55)',
  },
  {
    label: 'GBDT',
    sublabel: '+ embeddings',
    mae: 138.11,
    color: '#94bce3',
    highlight: true,
  },
];

const MAX_MAE = 290;          // y-axis ceiling ($)
const CHART_H = 160;          // px height of the bar area

const barH = (mae: number) => Math.round((mae / MAX_MAE) * CHART_H);
const pct = (mae: number) => `${((mae / MAX_MAE) * 100).toFixed(1)}%`;

const MONO_STYLE: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
};

export default function BoostingLift() {
  const winnerH = barH(BARS[2].mae);
  const baseH   = barH(BARS[0].mae);

  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '20px 18px 16px',
        margin: '24px 0',
        background: 'rgba(13,17,23,0.4)',
      }}
    >
      {/* caption */}
      <div style={{ ...MONO_STYLE, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94bce3', marginBottom: 4 }}>
        MAE improvement · full corpus, 270 items, 68-item hold-out
      </div>
      <div style={{ ...MONO_STYLE, color: '#8b98a8', marginBottom: 20 }}>
        sklearn GradientBoostingRegressor · seed=0 · PCA 16-dim title embeddings
      </div>

      {/* bar chart */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 24,
          height: CHART_H + 2,
          borderBottom: '1px solid rgba(148,163,184,0.18)',
          paddingBottom: 2,
          position: 'relative',
        }}
      >
        {BARS.map((b, i) => {
          const h = barH(b.mae);
          return (
            <div key={b.label + b.sublabel + i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
              {/* MAE label above bar */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ amount: 0.4 }}
                transition={{ delay: 0.4 + i * 0.2 }}
                style={{ ...MONO_STYLE, color: b.highlight ? '#94bce3' : '#cdd7e2', marginBottom: 6, fontWeight: b.highlight ? 700 : 400 }}
              >
                ${b.mae}
              </motion.div>

              {/* bar */}
              <motion.div
                style={{
                  width: '100%',
                  height: h,
                  background: b.color,
                  borderRadius: '4px 4px 0 0',
                  boxShadow: b.highlight ? `0 0 12px rgba(148,188,227,0.35)` : 'none',
                }}
                initial={{ scaleY: 0, transformOrigin: 'bottom' }}
                whileInView={{ scaleY: 1 }}
                viewport={{ amount: 0.4 }}
                transition={{ delay: 0.1 + i * 0.2, duration: 0.55, ease: 'easeOut' as const }}
              />
            </div>
          );
        })}

        {/* bracket: linear height → winner height, rightward of center */}
        <motion.div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 2,
            width: 18,
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.4 }}
          transition={{ delay: 0.9 }}
        >
          {/* vertical line spanning the drop */}
          <div
            style={{
              position: 'absolute',
              right: 4,
              bottom: winnerH,
              width: 2,
              height: baseH - winnerH,
              background: 'rgba(148,188,227,0.6)',
            }}
          />
          {/* top tick */}
          <div style={{ position: 'absolute', right: 2, bottom: baseH - 1, width: 6, height: 2, background: 'rgba(148,188,227,0.6)' }} />
          {/* bottom tick */}
          <div style={{ position: 'absolute', right: 2, bottom: winnerH, width: 6, height: 2, background: 'rgba(148,188,227,0.6)' }} />
        </motion.div>
      </div>

      {/* x-axis labels */}
      <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
        {BARS.map((b, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ ...MONO_STYLE, color: b.highlight ? '#94bce3' : '#cdd7e2', fontWeight: b.highlight ? 700 : 400 }}>
              {b.label}
            </div>
            <div style={{ ...MONO_STYLE, color: '#8b98a8' }}>{b.sublabel}</div>
          </div>
        ))}
      </div>

      {/* key takeaway row */}
      <motion.div
        style={{ ...MONO_STYLE, color: '#cdd7e2', marginTop: 16, padding: '8px 12px', background: 'rgba(148,188,227,0.08)', borderRadius: 8, borderLeft: '3px solid #94bce3' }}
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ amount: 0.4 }}
        transition={{ delay: 1.0 }}
      >
        <strong style={{ color: '#94bce3' }}>−39.4% MAE</strong>
        {' '}($227.89 → $138.11) · embeddings are the hero — GBDT without them loses to linear ($257.99)
      </motion.div>

      {/* legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', ...MONO_STYLE, color: '#8b98a8' }}>
        <span><span style={{ color: 'rgba(148,163,184,0.7)' }}>■</span> linear baseline</span>
        <span><span style={{ color: 'rgba(201,140,70,0.8)' }}>■</span> GBDT hand-only</span>
        <span><span style={{ color: '#94bce3' }}>■</span> GBDT + embeddings (winner)</span>
        <span>lower bar = lower MAE = better</span>
      </div>
    </div>
  );
}
