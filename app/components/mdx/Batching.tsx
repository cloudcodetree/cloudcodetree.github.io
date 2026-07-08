'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of batched inference for the DealFinder /search endpoint:
 * many in-flight deal-scoring requests are grouped into one model forward pass
 * (continuous batching, as in vLLM) then results return together — far higher
 * GPU throughput than one-at-a-time. Request dots represent concurrent /deal
 * lookups; each carries a product from the electronics snapshot. Static-safe.
 */

const REQS = [
  { label: 'XM5 · $162.97' },
  { label: 'Q20i · $44.99' },
  { label: 'QC45 · $46.00' },
  { label: 'XM6 · $399.99' },
  { label: 'JBL 770NC' },
];

export default function Batching({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Batch requests for throughput
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {/* incoming /deal requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
          {REQS.map((r, i) => (
            <motion.div
              key={r.label}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              animate={{ x: [0, 8, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.12 }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: accent }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>{r.label}</span>
            </motion.div>
          ))}
        </div>

        <span style={{ fontFamily: MONO, fontSize: 16, color: '#8b98a8' }}>→</span>

        {/* the batch + model pass */}
        <motion.div
          style={{ flex: '0 0 auto', border: `1.5px solid ${accent}73`, background: `${accent}10`, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}
          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#fff' }}>1 batched pass</div>
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6 }}>
            {REQS.map((r) => <span key={r.label} style={{ width: 7, height: 7, borderRadius: 2, background: accent }} />)}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 6 }}>GPU stays busy</div>
        </motion.div>

        <span style={{ fontFamily: MONO, fontSize: 16, color: '#8b98a8' }}>→</span>

        {/* deal scores out */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
          {REQS.map((r, i) => (
            <motion.div
              key={r.label}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              animate={{ x: [0, 8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 + i * 0.06 }}
            >
              <span style={{ color: '#3fb950', fontSize: 11 }}>✓</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>score {i + 1}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        One-at-a-time leaves the GPU idle between calls; <span style={{ color: accent }}>continuous batching</span> (vLLM) packs them — many× the throughput.
      </div>
    </div>
  );
}
