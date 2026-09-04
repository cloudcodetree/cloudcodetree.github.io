'use client';

import { motion } from 'framer-motion';
import { MONO } from '../blogShared';

/**
 * PriceDropForecast — bespoke animation for Part 17 (ML & DL breadth).
 *
 * Metaphor: a sparkline + one-step projection. Shows the 12-week synthetic
 * price history for Sony WH-1000XM5 anchor at $162.97, plus the fitted linear
 * trend and the projected next step at $162.32. The "illustrative" label is
 * prominent: no real price_history exists in the snapshot.
 *
 * All numbers are REAL from test_models.py / forecast_price_drop(
 *   synthetic_price_history(162.97, seed=42)).
 *   last_price=164.24, forecast_next=162.32, slope_per_step=-0.816,
 *   drop_pct=1.16, will_drop=True.
 *
 * Static-export-safe: no runtime fetch, seeded deterministic series.
 */

// Synthetic history reproduced from synthetic_price_history(162.97, n=12, seed=42).
// These are the exact values the function returns on Python 3.12 / numpy
// (a seeded mild downtrend around the anchor — noisy, not monotone).
const HISTORY: number[] = [
  173.24, 170.16, 172.19, 171.61, 166.01, 166.18,
  167.62, 166.01, 165.61, 163.36, 165.29, 164.24,
];
// last_price (week 12) = 164.24; forecast_next = 162.32 (from polyfit extrapolation).
const FORECAST = 162.32;
const LAST_ACTUAL = 164.24;

const W = 360;   // total SVG width (viewBox units)
const H = 110;   // SVG height
const PAD_L = 36;
const PAD_R = 56; // extra right pad for forecast point
const PAD_T = 14;
const PAD_B = 24;

const allValues = [...HISTORY, FORECAST];
const minV = Math.min(...allValues) - 1;
const maxV = Math.max(...allValues) + 1;

const plotW = W - PAD_L - PAD_R;
const plotH = H - PAD_T - PAD_B;

const toX = (i: number, total: number) =>
  PAD_L + (i / (total - 1)) * plotW;
const toY = (v: number) =>
  PAD_T + plotH - ((v - minV) / (maxV - minV)) * plotH;

// Actual history path
const historyPoints = HISTORY.map((v, i) => ({
  x: toX(i, HISTORY.length + 1), // +1 for forecast slot
  y: toY(v),
}));

// Forecast point (one step beyond the last history point)
const forecastX = toX(HISTORY.length, HISTORY.length + 1);
const forecastY = toY(FORECAST);

// Trend line: endpoints spanning full plot
const trendSlope = -0.816;
const trendYstart = toY(HISTORY[0] - trendSlope * 0);   // reuse anchor model
const trendYend   = toY(HISTORY[0] + trendSlope * (HISTORY.length));

const pathD = historyPoints
  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
  .join(' ');

const totalLen = historyPoints.reduce((acc, p, i) => {
  if (i === 0) return 0;
  const prev = historyPoints[i - 1];
  return acc + Math.hypot(p.x - prev.x, p.y - prev.y);
}, 0);

const MONO_STYLE: React.CSSProperties = { fontFamily: MONO, fontSize: 11 };

export default function PriceDropForecast() {
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
      {/* header */}
      <div style={{ ...MONO_STYLE, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#58a6ff', marginBottom: 2 }}>
        Sony WH-1000XM5 · price-drop forecast
      </div>
      <div style={{ ...MONO_STYLE, color: '#d29922', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ background: 'rgba(210,153,34,0.15)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(210,153,34,0.4)' }}>
          ILLUSTRATIVE — synthetic history, no real price_history in snapshot
        </span>
      </div>

      {/* sparkline */}
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }} aria-label="Price sparkline for Sony WH-1000XM5 synthetic history">

          {/* y-axis ticks */}
          {[170, 165, 162].map((v) => (
            <g key={v}>
              <line x1={PAD_L - 4} x2={PAD_L} y1={toY(v)} y2={toY(v)} stroke="rgba(148,163,184,0.25)" strokeWidth={1} />
              <text x={PAD_L - 6} y={toY(v) + 4} textAnchor="end" fill="#8b98a8" fontSize={9} fontFamily="monospace">
                ${v}
              </text>
            </g>
          ))}

          {/* trend line */}
          <motion.line
            x1={historyPoints[0].x} y1={trendYstart}
            x2={forecastX}          y2={trendYend}
            stroke="rgba(88,166,255,0.25)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.6, duration: 1.0 }}
          />

          {/* history line — drawn via stroke-dashoffset animation */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="#58a6ff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLen}
            initial={{ strokeDashoffset: totalLen, opacity: 0 }}
            whileInView={{ strokeDashoffset: 0, opacity: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ duration: 1.0, ease: 'easeInOut' as const }}
          />

          {/* connector dashed to forecast */}
          <motion.line
            x1={historyPoints[historyPoints.length - 1].x}
            y1={historyPoints[historyPoints.length - 1].y}
            x2={forecastX} y2={forecastY}
            stroke="#94bce3"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 1.1 }}
          />

          {/* history dots */}
          {historyPoints.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x} cy={p.y} r={3}
              fill="#58a6ff"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ amount: 0.4 }}
              transition={{ delay: 0.05 * i + 0.2 }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            />
          ))}

          {/* forecast dot — green, pulsing */}
          <motion.circle
            cx={forecastX} cy={forecastY} r={5}
            fill="#94bce3"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 1.2, duration: 0.5, opacity: { repeat: Infinity, duration: 2, delay: 1.7 } }}
            style={{ transformOrigin: `${forecastX}px ${forecastY}px` }}
          />

          {/* last actual label */}
          <text x={historyPoints[historyPoints.length - 1].x} y={historyPoints[historyPoints.length - 1].y - 8}
            textAnchor="middle" fill="#cdd7e2" fontSize={9} fontFamily="monospace">
            ${LAST_ACTUAL}
          </text>

          {/* forecast label */}
          <text x={forecastX + 4} y={forecastY - 8} textAnchor="start" fill="#94bce3" fontSize={9} fontFamily="monospace">
            ${FORECAST} →
          </text>

          {/* x-axis week labels */}
          {[0, 6, 11].map((i) => (
            <text key={i} x={historyPoints[i].x} y={H - 6} textAnchor="middle" fill="#8b98a8" fontSize={9} fontFamily="monospace">
              w{i + 1}
            </text>
          ))}
          <text x={forecastX} y={H - 6} textAnchor="middle" fill="#94bce3" fontSize={9} fontFamily="monospace">
            w13
          </text>
        </svg>
      </div>

      {/* stats row */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
          marginTop: 10,
          ...MONO_STYLE,
          color: '#cdd7e2',
        }}
      >
        <span>last_price <strong>${LAST_ACTUAL}</strong></span>
        <span>forecast_next <strong style={{ color: '#94bce3' }}>${FORECAST}</strong></span>
        <span>slope <strong>−0.816/wk</strong></span>
        <span>will_drop <strong style={{ color: '#94bce3' }}>True</strong></span>
        <span style={{ color: '#8b98a8' }}>drop_pct 1.16%</span>
      </div>
    </div>
  );
}
