'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of deal scoring — a barbell/range chart, deliberately not
 * another scatter. For each flagged tent it shows the predicted FAIR price and
 * the ACTUAL price on one track; the green gap between them is the deal. These
 * are the real deals the model surfaced in `python -m dealfinder.train_model`.
 *
 * Bars/markers slide in; the gap pulses. Static-safe: prices + "% off" are real
 * text. Numbers come straight from the verified training run.
 */

type Deal = { id: string; actual: number; fair: number; off: number };

// from the real run: tent, actual $, fair $, % off
const DEALS: Deal[] = [
  { id: 'tent-09', actual: 360, fair: 499, off: 28 },
  { id: 'tent-03', actual: 288, fair: 393, off: 27 },
  { id: 'tent-17', actual: 284, fair: 343, off: 17 },
  { id: 'tent-24', actual: 328, fair: 395, off: 17 },
];

const MAX = 520; // axis max ($)
const pct = (v: number) => `${(v / MAX) * 100}%`;

export default function DealResidual({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        A deal = price below the predicted fair value
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        the four tents the model flagged
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DEALS.map((d, i) => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: '#cdd7e2', width: 64, flex: '0 0 auto' }}>{d.id}</span>
            <div style={{ position: 'relative', flex: 1, height: 22 }}>
              {/* track */}
              <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 2, background: 'rgba(148,163,184,0.18)' }} />
              {/* the gap (deal) */}
              <motion.div
                style={{ position: 'absolute', top: 8, left: pct(d.actual), width: pct(d.fair - d.actual), height: 6, background: `${accent}`, borderRadius: 3 }}
                initial={{ opacity: 0, scaleX: 0, transformOrigin: 'left' }}
                whileInView={{ opacity: [0.5, 1, 0.5], scaleX: 1 }}
                viewport={{ amount: 0.4 }}
                transition={{ scaleX: { delay: 0.3 + i * 0.12, duration: 0.5 }, opacity: { delay: 0.8, duration: 2.4, repeat: Infinity } }}
              />
              {/* actual price marker (green, filled) */}
              <motion.div
                style={{ position: 'absolute', top: 4, left: pct(d.actual), transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12 }}
              >
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#3fb950', border: '2px solid #0d1117' }} />
              </motion.div>
              {/* fair price marker (hollow accent) */}
              <motion.div
                style={{ position: 'absolute', top: 4, left: pct(d.fair), transform: 'translateX(-50%)' }}
                initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12 }}
              >
                <span style={{ display: 'block', width: 11, height: 11, borderRadius: '50%', background: 'transparent', border: `2px solid ${accent}` }} />
              </motion.div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', width: 132, flex: '0 0 auto', textAlign: 'right' }}>
              <span style={{ color: '#3fb950' }}>${d.actual}</span> vs <span style={{ color: accent }}>${d.fair}</span> · <b style={{ color: '#3fb950' }}>{d.off}% off</b>
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap', fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>
        <span><span style={{ color: '#3fb950' }}>●</span> actual price</span>
        <span><span style={{ color: accent }}>○</span> predicted fair price</span>
        <span><span style={{ color: accent }}>▬</span> the gap = how good the deal is</span>
      </div>
    </div>
  );
}
