'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of a golden-set eval: each labeled case runs through the
 * system and its prediction is checked against the known-correct answer; passes
 * tally into a score. Cases stamp in and flip to ✓/✗. Static-safe.
 */

const CASES = [
  { id: 'tent UL2', ok: true },
  { id: 'expedition', ok: true },
  { id: 'family 2400g', ok: true },
  { id: 'solo 1P', ok: true },
];

export default function EvalGauntlet({ accent = ACCENT }: { accent?: string }) {
  const passed = CASES.filter((c) => c.ok).length;
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Score against the golden set
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CASES.map((c, i) => {
          const col = c.ok ? '#3fb950' : '#f85149';
          return (
            <motion.div
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: i * 0.12 }}
            >
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', width: 110 }}>{c.id}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>predict → compare to gold</span>
              <motion.span
                style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: col, border: `1px solid ${col}73`, background: `${col}14`, borderRadius: 6, padding: '3px 9px' }}
                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 300, damping: 16 }}
              >{c.ok ? '✓ match' : '✕ miss'}</motion.span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 16, fontFamily: MONO, fontSize: 12, color: '#cdd7e2' }}>
        <span>exact_match = {passed}/{CASES.length} = <span style={{ color: accent }}>{(passed / CASES.length).toFixed(2)}</span></span>
        <span style={{ color: '#8b98a8' }}>· one number you can track on every commit</span>
      </div>
    </div>
  );
}
