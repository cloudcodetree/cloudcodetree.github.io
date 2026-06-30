'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of fitting a linear price model (OLS): each tent is a
 * point (here, capacity vs price); the model learns the line that minimises the
 * total squared vertical gap (the residuals). The line IS the predicted fair
 * price for any capacity. Points fade in, the best-fit line draws across, then
 * residual segments appear — the thing least-squares actually shrinks.
 *
 * One feature is shown for legibility; the real model uses all four. Points are
 * illustrative. Static-safe: it resolves to a labeled scatter + line with no JS.
 */

const W = 460, H = 270;
const PAD = { l: 52, r: 20, t: 24, b: 40 };
const CAP = [1, 4], PRICE = [100, 380];

const xOf = (cap: number) => PAD.l + ((cap - CAP[0]) / (CAP[1] - CAP[0])) * (W - PAD.l - PAD.r);
const yOf = (price: number) => H - PAD.b - ((price - PRICE[0]) / (PRICE[1] - PRICE[0])) * (H - PAD.t - PAD.b);

// (capacity, price) — roughly along price = 70 + 70·capacity
const PTS: [number, number][] = [
  [1, 150], [1, 124], [2, 232], [2, 205], [3, 292], [3, 268], [4, 352], [4, 330], [3, 250], [2, 188],
];
const lineY = (cap: number) => 70 + 70 * cap; // the fitted relationship

export default function RegressionFit({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Fitting the fair-price line
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 10 }}>
        least squares shrinks the total vertical gap
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* axes */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="rgba(148,163,184,0.3)" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="rgba(148,163,184,0.3)" />
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 8} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={11} fill="#8b98a8">capacity (persons)</text>
        <text x={14} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={11} fill="#8b98a8" transform={`rotate(-90 14 ${(PAD.t + H - PAD.b) / 2})`}>price ($)</text>

        {/* residual segments (point → line) */}
        {PTS.map(([cap, price], i) => (
          <motion.line
            key={`r${i}`}
            x1={xOf(cap)} y1={yOf(price)} x2={xOf(cap)} y2={yOf(lineY(cap))}
            stroke="#f85149" strokeWidth={1.5}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.55 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 1.1 + i * 0.05, duration: 0.4 }}
          />
        ))}

        {/* best-fit line */}
        <motion.line
          x1={xOf(1)} y1={yOf(lineY(1))} x2={xOf(4)} y2={yOf(lineY(4))}
          stroke={accent} strokeWidth={2.5}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ amount: 0.4 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />

        {/* data points */}
        {PTS.map(([cap, price], i) => (
          <motion.circle
            key={`p${i}`}
            cx={xOf(cap)} cy={yOf(price)} r={5}
            fill="#fff" stroke={accent} strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 18 }}
          />
        ))}
      </svg>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 8 }}>
        The <span style={{ color: accent }}>line</span> is the model&apos;s predicted fair price; each <span style={{ color: '#f85149' }}>red gap</span> is one tent&apos;s error.
      </div>
    </div>
  );
}
