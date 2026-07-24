'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for Part 1 dedup: the SAME product arrives from two
 * retailers at different prices. Their exact-match dedup_key differs (raw brand
 * is the retailer, and the titles aren't byte-identical), so BOTH are kept — a
 * deal aggregator wants the cross-store comparison. The cheapest offer wins the
 * buy box; recognizing the two as one product is the semantic (cosine) dedup in
 * Part 9.
 *
 * Real snapshot values (electronics-2026-07.json): Sony WH-1000XM5 at Costco
 * ($162.97) vs Macy's ($248.00). Static-safe: resolved state reads with no JS.
 */

type Cand = { source: string; color: string; price: string; best?: boolean };

const card = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 10,
  background: 'rgba(148,163,184,0.05)',
  padding: '10px 13px',
};

export default function DedupMerge({
  title = 'Sony WH-1000XM5',
  candidates = [
    { source: "Macy's", color: '#8b98a8', price: '$248.00' },
    { source: 'Costco', color: '#3fb950', price: '$162.97', best: true },
  ],
  accent = ACCENT,
}: {
  title?: string;
  candidates?: Cand[];
  accent?: string;
}) {
  const best = candidates.find((c) => c.best) ?? candidates[candidates.length - 1];

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Cross-retailer offers → keep both, cheapest wins the buy box
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* two offers with DIFFERENT keys — both kept */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 220px', minWidth: 200 }}>
          {candidates.map((c, i) => (
            <motion.div
              key={c.source}
              style={{ ...card, borderColor: c.best ? '#3fb95066' : 'rgba(148,163,184,0.18)', background: c.best ? 'rgba(63,185,80,0.08)' : 'rgba(148,163,184,0.05)' }}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.5 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 220, damping: 22 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{title}</span>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 13, color: c.best ? '#3fb950' : '#cdd7e2', fontWeight: 700 }}>
                  {c.price}
                </span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: c.color, marginTop: 3 }}>from {c.source}</div>
            </motion.div>
          ))}
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', textAlign: 'center' }}>
            different dedup_key (retailer + title differ) → both kept
          </div>
        </div>

        {/* arrow to the buy box */}
        <motion.div
          style={{ fontFamily: MONO, fontSize: 20, color: accent, flex: '0 0 auto' }}
          animate={{ x: [-2, 3, -2], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }}
        >→</motion.div>

        {/* the buy box: cheapest surfaced, both retained */}
        <motion.div
          style={{ ...card, flex: '1 1 190px', minWidth: 180, borderColor: `${accent}73`, background: `${accent}10` }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ amount: 0.5 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <motion.span
              style={{ color: '#3fb950', fontWeight: 700 }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >★</motion.span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>buy box</span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 14, color: '#3fb950', fontWeight: 700 }}>{best.price}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 3 }}>
            {best.source} · cheapest · both offers kept
          </div>
        </motion.div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        Same product, two stores — that&apos;s a comparison, not a duplicate. Merging them into one product (despite different retailer brands and titles) is the semantic cosine dedup in <span style={{ color: accent }}>Part 9</span>.
      </div>
    </div>
  );
}
