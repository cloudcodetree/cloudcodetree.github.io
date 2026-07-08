'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of a golden-set eval for real electronics listings:
 * each item is scored by the ranker, the predicted verdict (deal / not-deal) is
 * checked against the hand-labeled ground truth, and hits tally into precision@5.
 * The top-5 from two_signal all flip green; a median-only false positive flips red.
 * Static-safe.
 */

const TOP5 = [
  { title: 'Armitron Link Smart Watch', label: 'deal', correct: true },
  { title: 'Anker Soundcore Q20i', label: 'deal', correct: true },
  { title: 'JBL Tune 770NC', label: 'deal', correct: true },
  { title: 'Sony WH-CH720N', label: 'deal', correct: true },
  { title: 'Sony WH-CH720N/P', label: 'deal', correct: true },
];

const TRAP = { title: 'Bose QuietComfort 45  $46', label: 'suspicious', correct: false };

export default function EvalGauntlet({ accent = ACCENT }: { accent?: string }) {
  const passed = TOP5.filter((c) => c.correct).length;
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        two_signal top-5 — scored against the golden set
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        precision@5 = deals in top 5 / 5
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {TOP5.map((c, i) => {
          const col = '#3fb950';
          return (
            <motion.div
              key={c.title}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: i * 0.10 }}
            >
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', width: 18, flex: '0 0 auto' }}>#{i + 1}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
              <motion.span
                style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: col, border: `1px solid ${col}73`, background: `${col}14`, borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}
                initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.28 + i * 0.10, type: 'spring', stiffness: 300, damping: 16 }}
              >deal ✓</motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* show what median-only would have put here instead */}
      <div style={{ borderTop: '1px solid rgba(148,163,184,0.10)', paddingTop: 10, marginBottom: 10 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>
          median-only would have ranked #1:
        </div>
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.6 }}
        >
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', width: 18, flex: '0 0 auto' }}>#1</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', flex: 1 }}>{TRAP.title}</span>
          <motion.span
            style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#f85149', border: '1px solid #f8514973', background: 'rgba(248,81,73,0.10)', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap' }}
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.75, type: 'spring', stiffness: 300, damping: 16 }}
          >suspicious ✕</motion.span>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 8, fontFamily: MONO, fontSize: 12, color: '#cdd7e2', flexWrap: 'wrap' }}>
        <span>two_signal precision@5 = {passed}/{TOP5.length} = <span style={{ color: accent }}>1.00</span></span>
        <span style={{ color: '#8b98a8' }}>· one number you can gate on every commit</span>
      </div>
    </div>
  );
}
