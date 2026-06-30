'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of an A/B comparison gating a deploy: two variants scored
 * on the golden set, the winner crowned, and a CI gate that only goes green when
 * the metric clears the bar. Bars grow; the gate flips. Static-safe.
 */

export default function ABCompare({ accent = ACCENT }: { accent?: string }) {
  const A = { name: 'rule_extract', score: 1.0 };
  const B = { name: 'brand_only', score: 0.25 };
  const winner = A.score >= B.score ? A : B;

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        A/B — and a gate to ship behind
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[A, B].map((v, i) => {
          const win = v.name === winner.name;
          const col = win ? accent : '#8b98a8';
          return (
            <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: win ? '#fff' : '#8b98a8', width: 110, flex: '0 0 auto' }}>
                {win && <span style={{ color: accent }}>★ </span>}{v.name}
              </span>
              <div style={{ flex: 1, height: 16, background: 'rgba(148,163,184,0.07)', borderRadius: 5, overflow: 'hidden', maxWidth: 320 }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 5, background: col }}
                  initial={{ width: 0 }} whileInView={{ width: `${v.score * 100}%` }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.2, duration: 0.7 }}
                />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: col, width: 40, flex: '0 0 auto' }}>{v.score.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>CI gate: exact_match ≥ 0.90</span>
        <span style={{ color: accent }}>→</span>
        <motion.span
          style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#3fb950', border: '1px solid #3fb95073', background: 'rgba(63,185,80,0.12)', borderRadius: 7, padding: '5px 12px' }}
          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
        >✓ merge allowed</motion.span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>regressions fail the build, automatically</span>
      </div>
    </div>
  );
}
