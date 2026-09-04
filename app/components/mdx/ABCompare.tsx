'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the real Part-16 A/B: two_signal (precision@5 = 1.00)
 * vs median_only (precision@5 = 0.40) on the 20-item electronics golden set.
 * Bars grow to their real proportions; the CI gate at 0.80 flips green for the
 * winner and red for the baseline. Static-safe.
 */

export default function ABCompare({ accent = ACCENT }: { accent?: string }) {
  // Real measured values from python -m dealfinder.run_evals against the frozen snapshot.
  const A = { name: 'two_signal', score: 1.0, label: 'precision@5 = 1.00  PASS' };
  const B = { name: 'median_only', score: 0.4, label: 'precision@5 = 0.40  FAIL' };
  const GATE = 0.80;
  const winner = A.score >= B.score ? A : B;

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        A/B — precision@5 on 20-item electronics golden set
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        gate: precision@5 ≥ {GATE.toFixed(2)} · delta = +0.60
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[A, B].map((v, i) => {
          const win = v.name === winner.name;
          const passes = v.score >= GATE;
          const barCol = passes ? accent : '#f85149';
          const nameCol = win ? '#fff' : '#8b98a8';
          return (
            <div key={v.name}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: nameCol, width: 110, flex: '0 0 auto' }}>
                  {win && <span style={{ color: accent }}>★ </span>}{v.name}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: passes ? accent : '#f85149' }}>{v.label}</span>
              </div>
              {/* bar tracks 0→1 range; gate marker at 80% */}
              <div style={{ position: 'relative', height: 14, background: 'rgba(148,163,184,0.07)', borderRadius: 5, overflow: 'visible', maxWidth: 360 }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 5, background: barCol, position: 'absolute', top: 0, left: 0 }}
                  initial={{ width: 0 }} whileInView={{ width: `${v.score * 100}%` }} viewport={{ amount: 0.4 }} transition={{ delay: 0.15 + i * 0.2, duration: 0.7 }}
                />
                {/* gate line */}
                <div style={{ position: 'absolute', top: -3, left: `${GATE * 100}%`, width: 1, height: 20, background: 'rgba(148,163,184,0.45)' }} />
                <span style={{ position: 'absolute', top: -14, left: `${GATE * 100 - 1}%`, fontFamily: MONO, fontSize: 9, color: '#8b98a8', whiteSpace: 'nowrap' }}>gate 0.80</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>CI: python -m dealfinder.run_evals</span>
        <span style={{ color: accent }}>→</span>
        <motion.span
          style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#94bce3', border: '1px solid #94bce373', background: 'rgba(148,188,227,0.12)', borderRadius: 7, padding: '5px 12px' }}
          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
        >✓ gate PASS — merge allowed</motion.span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 8 }}>
        ab_compare("two_signal", 1.0, "median_only", 0.4) → winner: two_signal · delta: 0.6
      </div>
    </div>
  );
}
