'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of input drift: this week's distribution has shifted from
 * the training baseline; the PSI crosses the 0.2 threshold and a retrain is
 * triggered. Reference vs current bars shown side by side; the gauge trips.
 * Static-safe.
 */

const REF = [50, 30, 20];
const CUR = [18, 30, 52];
const BUCKETS = ['budget', 'mid', 'premium'];
const PSI = 0.41; // > 0.2 → drift

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
        Watch for drift, retrain on cue
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
        <Bars data={REF} label="training baseline" color="#8b98a8" />
        <Bars data={CUR} label="this week's traffic" color={accent} />

        <div style={{ flex: '1 1 150px', minWidth: 140 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2' }}>PSI = <span style={{ color: '#f85149' }}>{PSI}</span></div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', margin: '4px 0 8px' }}>threshold 0.2</div>
          <motion.div
            style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#f85149', border: '1px solid #f8514973', background: 'rgba(248,81,73,0.1)', borderRadius: 7, padding: '6px 10px', display: 'inline-block' }}
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity }}
          >⚠ drift → retrain scheduled</motion.div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        Buyers shifted toward premium tents — the price model&apos;s world changed. Catch it automatically, before the deal scores rot.
      </div>
    </div>
  );
}
