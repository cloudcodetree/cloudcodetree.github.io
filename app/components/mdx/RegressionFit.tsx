'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of fitting a linear price model (OLS) on broad consumer
 * electronics: each point is a real headphone listing (brand tier vs. price);
 * the model learns the line that minimises the total squared vertical gap (the
 * residuals). The line IS the predicted fair price for any brand tier. Points
 * fade in, the best-fit line draws across, then residual segments appear.
 *
 * One feature is shown for legibility; the real model uses category, brand_tier,
 * and condition. Points are representative of the headphones subset in the
 * electronics-2026-07 snapshot. Static-safe: real text in DOM, no runtime fetch.
 */

const W = 460, H = 270;
const PAD = { l: 52, r: 20, t: 24, b: 40 };
const TIER = [1, 4], PRICE = [20, 420];

const xOf = (tier: number) => PAD.l + ((tier - TIER[0]) / (TIER[1] - TIER[0])) * (W - PAD.l - PAD.r);
const yOf = (price: number) => H - PAD.b - ((price - PRICE[0]) / (PRICE[1] - PRICE[0])) * (H - PAD.t - PAD.b);

// (brand_tier, price) — electronics headphone listings, roughly along price = -50 + 85·tier
// Tier 1=unknown, 2=Anker/JLab/Soundcore, 3=JBL/Beats/Samsung, 4=Sony/Bose/Sennheiser
const PTS: [number, number, boolean][] = [
  // [tier, price, isOutlier]
  [1, 28],   [1, 35],   [2, 45],   [2, 62],   [2, 80],
  [3, 119],  [3, 149],  [3, 169],  [4, 249],  [4, 330],
  [4, 163],  // Sony XM5 Costco — at the line
  [4,  46],  // Bose QC45 — far below the line (the trap)
  [2,  45],  // Anker Q20i — modest below-line (genuine deal)
  [4, 400],  // Sony XM6 — above the line
].map(([t, p], i) => [t, p, i === 11] as [number, number, boolean]); // Bose is the outlier (index 11 = Bose QC45)

const lineY = (tier: number) => -50 + 85 * tier; // the fitted fair-price relationship

// Named labels for key points (indices into PTS: XM5=10, Bose=11, Anker=12, XM6=13)
const LABELS: { i: number; label: string; dy: number }[] = [
  { i: 10, label: 'XM5 $163', dy: -10 },
  { i: 11, label: 'Bose $46 ⚠', dy: 12 },
  { i: 12, label: 'Anker $45', dy: -10 },
  { i: 13, label: 'XM6 $400', dy: -10 },
];

export default function RegressionFit({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Fitting the fair-price line — headphones subset
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 10 }}>
        brand tier vs. price · least squares shrinks the vertical gaps
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* axes */}
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="rgba(148,163,184,0.3)" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="rgba(148,163,184,0.3)" />
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 8} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={11} fill="#8b98a8">brand tier (1=unknown → 4=flagship)</text>
        <text x={14} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={11} fill="#8b98a8" transform={`rotate(-90 14 ${(PAD.t + H - PAD.b) / 2})`}>price ($)</text>

        {/* tier tick labels */}
        {[1, 2, 3, 4].map(t => (
          <text key={t} x={xOf(t)} y={H - PAD.b + 14} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={10} fill="#8b98a8">{t}</text>
        ))}

        {/* residual segments (point → line), red for outlier, subtle for rest */}
        {PTS.map(([tier, price, isOutlier], i) => (
          <motion.line
            key={`r${i}`}
            x1={xOf(tier)} y1={yOf(price)} x2={xOf(tier)} y2={yOf(lineY(tier))}
            stroke={isOutlier ? '#f85149' : 'rgba(248,81,73,0.35)'}
            strokeWidth={isOutlier ? 2.5 : 1.2}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: isOutlier ? 1 : 0.55 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 1.1 + i * 0.04, duration: 0.4 }}
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
        {PTS.map(([tier, price, isOutlier], i) => (
          <motion.circle
            key={`p${i}`}
            cx={xOf(tier)} cy={yOf(price)} r={isOutlier ? 7 : 5}
            fill={isOutlier ? '#f85149' : '#fff'}
            stroke={isOutlier ? '#f85149' : accent}
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 18 }}
          />
        ))}

        {/* labels for hero-cast points */}
        {LABELS.map(({ i, label, dy }) => {
          const [tier, price] = PTS[i];
          return (
            <motion.text
              key={`lbl${i}`}
              x={xOf(tier)} y={yOf(price) + dy}
              textAnchor="middle" fontFamily="Menlo, monospace" fontSize={10}
              fill={PTS[i][2] ? '#f85149' : '#cdd7e2'}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }}
              transition={{ delay: 1.6 + i * 0.04 }}
            >{label}</motion.text>
          );
        })}
      </svg>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 8 }}>
        The <span style={{ color: accent }}>line</span> is the model&apos;s predicted fair price; each <span style={{ color: '#f85149' }}>red gap</span> is one listing&apos;s residual.
        The <span style={{ color: '#f85149' }}>large outlier</span> below tier 4 is the Bose QC45 at $46 — the trap the median alone misses.
      </div>

      {/* cost bowl: sum of squared residuals as a function of the line's slope */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
        <svg viewBox="0 0 200 92" style={{ width: 190, flex: '0 0 190px', height: 'auto', display: 'block' }}>
          <line x1="16" y1="80" x2="190" y2="80" stroke="rgba(148,163,184,0.3)" />
          <line x1="16" y1="8" x2="16" y2="80" stroke="rgba(148,163,184,0.3)" />
          {/* J(slope): smooth bowl, vertex at (103, 66) */}
          <path d="M 26,14 Q 103,118 180,14" fill="none" stroke={ACCENT} strokeWidth="2" />
          <motion.circle cx="103" cy="66" r="4" fill="#3fb950" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.5 }} transition={{ delay: 0.4 }} />
          <text x="103" y="58" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#3fb950">min — θ from the normal equation</text>
          <text x="40" y="24" fontFamily="Menlo, monospace" fontSize="8" fill="#8b98a8">too flat</text>
          <text x="140" y="24" fontFamily="Menlo, monospace" fontSize="8" fill="#8b98a8">too steep</text>
          <text x="103" y="90" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#8b98a8">line slope</text>
          <text x="8" y="44" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#8b98a8" transform="rotate(-90 8 44)">Σ residual²</text>
        </svg>
        <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', flex: '1 1 200px', minWidth: 190, lineHeight: 1.6 }}>
          Why a closed form exists: the total squared error is a <span style={{ color: ACCENT }}>smooth bowl</span> as you vary the line. The normal equation doesn&apos;t <i>search</i> for the bottom — it solves &quot;where is the gradient zero?&quot; directly and lands on the <span style={{ color: '#3fb950' }}>minimum</span> in one step.
        </div>
      </div>
    </div>
  );
}
