'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of a semantic cache: a reworded query that *means* the
 * same as a cached one is served from cache (≈0ms, $0) instead of recomputing.
 * Two electronics queries hit the cache; the second is a semantic hit. Static-safe.
 */

const ROWS = [
  { q: '"noise cancelling headphones"', hit: false, note: 'miss → compute & store', cost: '420ms · $0.002' },
  { q: '"wireless noise canceling headphones"', hit: true, note: 'semantic hit → cached', cost: '3ms · $0' },
];

export default function SemanticCacheViz({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Cache by meaning, not by string
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ROWS.map((r, i) => {
          const col = r.hit ? '#94bce3' : '#8b98a8';
          return (
            <motion.div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.3 }}
            >
              <code style={{ fontFamily: MONO, fontSize: 12, color: '#cdd7e2', flex: '1 1 220px', minWidth: 200 }}>{r.q}</code>
              <motion.span
                style={{ fontFamily: MONO, fontSize: 10, color: accent, border: `1px solid ${accent}59`, borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap' }}
                animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.8, repeat: Infinity }}
              >cosine ≥ 0.95?</motion.span>
              <span style={{ color: col }}>→</span>
              <motion.span
                style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: col, border: `1px solid ${col}73`, background: `${col}14`, borderRadius: 7, padding: '5px 10px', whiteSpace: 'nowrap' }}
                animate={r.hit ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}
              >{r.hit ? '✓' : '•'} {r.note}</motion.span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: col, width: 96, textAlign: 'right' }}>{r.cost}</span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        On repetitive traffic this is the cheapest win there is — <span style={{ color: '#94bce3' }}>~0ms, $0</span> for a paraphrase.
      </div>
    </div>
  );
}
