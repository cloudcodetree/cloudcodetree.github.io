'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the two-signal deal score — a barbell/range chart,
 * deliberately not another scatter. For each hero-cast headphone listing it shows
 * the predicted FAIR price and the ACTUAL price on one track; the gap is colour-
 * coded by verdict (green = deal, amber = suspicious, grey = overpriced/fair).
 *
 * All values are pinned from the electronics-2026-07 snapshot and the linear
 * baseline model (§9 of the course bible). Bars slide in; the suspicious gap
 * pulses amber to draw attention. Static-safe: prices are real text in the DOM.
 *
 * residual = fair − actual  (large positive = suspiciously cheap)
 * residual_frac = residual / fair
 * suspicious: median_signal >= 0.70 AND residual_frac > 0.70
 */

type HeroItem = {
  label: string;          // short name for display
  actual: number;         // real listed price ($)
  fair: number;           // model predicted fair price ($)
  residualFrac: number;   // (fair - actual) / fair
  verdict: 'deal' | 'suspicious' | 'fair' | 'overpriced';
};

// Pinned from electronics-2026-07 snapshot + linear baseline (spec §9)
const ITEMS: HeroItem[] = [
  { label: 'Anker Q20i',  actual:  44.99, fair: 108.33, residualFrac: 0.585, verdict: 'deal'       },
  { label: 'Bose QC45',   actual:  46.00, fair: 285.15, residualFrac: 0.839, verdict: 'suspicious' },
  { label: 'Sony XM5',    actual: 162.97, fair: 285.15, residualFrac: 0.428, verdict: 'fair'       },
  { label: 'Sony XM6',    actual: 399.99, fair: 285.15, residualFrac: -0.403, verdict: 'overpriced' },
];

const MAX = 430; // axis max ($) — just above XM6 actual
const pct = (v: number) => `${Math.max(0, Math.min(100, (v / MAX) * 100))}%`;

const VERDICT_GAP_COLOR: Record<string, string> = {
  deal:       '#3fb950',   // green
  suspicious: '#d29922',   // amber
  fair:       '#58a6ff',   // accent blue
  overpriced: 'rgba(148,163,184,0.35)',
};
const VERDICT_LABEL_COLOR: Record<string, string> = {
  deal:       '#3fb950',
  suspicious: '#d29922',
  fair:       '#8b98a8',
  overpriced: '#8b98a8',
};

export default function DealResidual({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Residual = fair − actual · the two signals side by side
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        hero-cast headphones · snapshot median $162.97 · linear baseline
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {ITEMS.map((d, i) => {
          const gapColor = VERDICT_GAP_COLOR[d.verdict];
          const labelColor = VERDICT_LABEL_COLOR[d.verdict];
          const isSuspicious = d.verdict === 'suspicious';
          const isOverpriced = d.verdict === 'overpriced';
          // For overpriced: actual > fair, so the "gap" extends right of fair
          const gapLeft  = isOverpriced ? pct(d.fair)   : pct(Math.min(d.actual, d.fair));
          const gapWidth = pct(Math.abs(d.fair - d.actual));

          return (
            <div key={d.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: MONO, fontSize: 11 }}>
                <span style={{ color: '#cdd7e2' }}>{d.label}</span>
                <span style={{ color: labelColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.verdict}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1, height: 22 }}>
                  {/* track */}
                  <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 2, background: 'rgba(148,163,184,0.18)' }} />
                  {/* the gap */}
                  <motion.div
                    style={{ position: 'absolute', top: 8, left: gapLeft, width: gapWidth, height: 6, background: gapColor, borderRadius: 3 }}
                    initial={{ opacity: 0, scaleX: 0, transformOrigin: 'left' }}
                    whileInView={isSuspicious
                      ? { opacity: [0.5, 1, 0.5], scaleX: 1 }
                      : { opacity: 0.8, scaleX: 1 }}
                    viewport={{ amount: 0.4 }}
                    transition={{
                      scaleX: { delay: 0.3 + i * 0.12, duration: 0.5 },
                      ...(isSuspicious ? { opacity: { delay: 0.8, duration: 2, repeat: Infinity } } : {}),
                    }}
                  />
                  {/* actual price marker */}
                  <motion.div
                    style={{ position: 'absolute', top: 4, left: pct(d.actual), transform: 'translateX(-50%)' }}
                    initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12 }}
                  >
                    <span style={{ display: 'block', width: 11, height: 11, borderRadius: '50%', background: '#3fb950', border: '2px solid #0d1117' }} />
                  </motion.div>
                  {/* fair price marker (hollow accent) */}
                  <motion.div
                    style={{ position: 'absolute', top: 4, left: pct(d.fair), transform: 'translateX(-50%)' }}
                    initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12 }}
                  >
                    <span style={{ display: 'block', width: 11, height: 11, borderRadius: '50%', background: 'transparent', border: `2px solid ${accent}` }} />
                  </motion.div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', width: 152, flex: '0 0 auto', textAlign: 'right' }}>
                  <span style={{ color: '#3fb950' }}>${d.actual}</span>
                  {' vs '}
                  <span style={{ color: accent }}>${d.fair}</span>
                  {' · '}
                  <b style={{ color: labelColor }}>rf={d.residualFrac > 0 ? '+' : ''}{d.residualFrac.toFixed(3)}</b>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 18, flexWrap: 'wrap', fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>
        <span><span style={{ color: '#3fb950' }}>●</span> actual price</span>
        <span><span style={{ color: accent }}>○</span> model fair price</span>
        <span><span style={{ color: '#3fb950' }}>▬</span> deal gap</span>
        <span><span style={{ color: '#d29922' }}>▬</span> suspicious gap (pulses)</span>
        <span style={{ color: '#cdd7e2' }}>rf = residual_frac = (fair − actual) / fair</span>
      </div>
    </div>
  );
}
