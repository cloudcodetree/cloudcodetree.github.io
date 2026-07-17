'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of context engineering: the window is RAM, not storage.
 * Real numbers from context.pack_deals over the DealFinder context (frozen
 * snapshot): a k=20 retrieved block is 1063 tokens; packed into a 256-token slice
 * only 4 items fit (244 tokens used), 16 are evicted. Plus lost-in-the-middle:
 * the strongest picks move to the edges. Static/hydration-safe (transform/opacity).
 */

const GREEN = '#3fb950';
const OVER = '#8b98a8';
const ACCENT2 = '#06b6d4';

// 20 retrieved items; first 4 fit the 256-token budget, the rest are evicted.
const ITEMS = Array.from({ length: 20 }, (_, i) => i < 4);

export default function ContextBudget({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        The window is RAM — pack what fits, evict the rest
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: OVER, marginBottom: 14 }}>
        retrieved k=20 = 1063 tokens · budget for the deal block = 256 tokens
      </div>

      {/* Budget bar: 20 item cells, first 4 green (kept), rest grey (dropped) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {ITEMS.map((kept, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: i * 0.03 }}
            title={kept ? 'included' : 'evicted'}
            style={{
              width: 30, height: 22, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, fontSize: 9, fontWeight: 700,
              color: kept ? '#0d1117' : OVER,
              background: kept ? GREEN : 'rgba(148,163,184,0.10)',
              border: `1px solid ${kept ? GREEN : 'rgba(148,163,184,0.18)'}`,
            }}
          >
            {i + 1}
          </motion.div>
        ))}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', marginBottom: 18 }}>
        <span style={{ color: GREEN }}>■ 4 included</span> (244 tok) ·{' '}
        <span style={{ color: OVER }}>■ 16 evicted</span> — the tail never reaches the model
      </div>

      {/* Lost in the middle: best picks to the edges */}
      <div style={{ fontFamily: MONO, fontSize: 10, color: OVER, marginBottom: 6 }}>
        then order for &ldquo;lost in the middle&rdquo; — strongest picks to the edges
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
        {[
          { label: '#1 best', edge: true },
          { label: '#3', edge: false },
          { label: '#5 weakest', edge: false },
          { label: '#4', edge: false },
          { label: '#2', edge: true },
        ].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 6, textAlign: 'center',
              fontFamily: MONO, fontSize: 10, fontWeight: 700,
              color: c.edge ? '#0d1117' : '#cdd7e2',
              background: c.edge ? ACCENT2 : 'rgba(148,163,184,0.08)',
              border: `1px solid ${c.edge ? ACCENT2 : 'rgba(148,163,184,0.18)'}`,
            }}
          >
            {c.label}
          </motion.div>
        ))}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: OVER, marginTop: 10 }}>
        Models recover the <span style={{ color: ACCENT2 }}>start and end</span> of a long context best, so the top two picks bracket the block; the weakest sits in the middle.
      </div>
    </div>
  );
}
