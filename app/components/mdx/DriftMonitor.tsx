'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of input-distribution drift for an electronics deal-finder.
 * Training snapshot (Jul 2026): headphones queries dominated. A month later,
 * "gaming laptop" and "ultrawide monitor" surge — the price model's priors go stale.
 * PSI > 0.2 fires: has_drifted([50,30,20], [10,30,60]) = True (PSI ≈ 1.08).
 * Real output from dealfinder/ops.py population_stability_index. Static-safe.
 */

// Three query-category buckets: audio, peripherals, displays
// ref = training snapshot distribution; cur = this week's traffic
const REF = [50, 30, 20]; // audio-heavy (noise-cancelling headphones dominated)
const CUR = [10, 30, 60]; // displays surged (ultrawide monitor queries)
const BUCKETS = ['audio', 'peripherals', 'displays'];
const PSI = 1.08; // real value: population_stability_index([50,30,20],[10,30,60]) ≈ 1.08322

function Bars({ data, label, color }: { data: number[]; label: string; color: string }) {
  const max = Math.max(...data);
  return (
    <div style={{ flex: '1 1 130px', minWidth: 120 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <motion.div
              style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0' }}
              initial={{ height: 0 }} whileInView={{ height: `${(v / max) * 56}px` }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
            />
            <span style={{ fontFamily: MONO, fontSize: 8, color: '#8b98a8' }}>{BUCKETS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DriftMonitor({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Input drift — query mix shifted, retrain triggered
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
        <Bars data={REF} label="training snapshot (Jul 2026)" color="#8b98a8" />
        <Bars data={CUR} label="this week&apos;s live traffic" color={accent} />

        <div style={{ flex: '1 1 150px', minWidth: 140 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2' }}>PSI = <span style={{ color: '#f85149' }}>{PSI}</span></div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', margin: '4px 0 8px' }}>threshold 0.2 — has_drifted() = True</div>
          <motion.div
            style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#f85149', border: '1px solid #f8514973', background: 'rgba(248,81,73,0.1)', borderRadius: 7, padding: '6px 10px', display: 'inline-block' }}
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity }}
          >drift detected — retrain scheduled</motion.div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        Display queries surged from 20% to 60% of traffic — the headphone-trained price model&apos;s priors are stale. Catch it before deal scores rot.
      </div>
    </div>
  );
}
