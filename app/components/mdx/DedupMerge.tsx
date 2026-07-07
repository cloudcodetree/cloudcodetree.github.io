'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for dedup: the SAME electronics product arrives from two
 * sources at different prices. They share a dedup_key (after title-brand extraction),
 * so they collapse to one row and the cheaper price wins.
 *
 * Default example: Sony WH-1000XM5 at Costco ($162.97) vs Macy's ($248.00) —
 * the canonical dedup case from the electronics-2026-07.json snapshot (Part 1 §9.6).
 * The higher-price card gets a strikethrough + "dropped" treatment; the Costco
 * card pulses green as the survivor.
 *
 * Static-safe: the resolved state ($162.97 kept) reads correctly with no JS.
 */

type Cand = { source: string; color: string; price: string; loser?: boolean };

const card = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 10,
  background: 'rgba(148,163,184,0.05)',
  padding: '10px 13px',
};

export default function DedupMerge({
  title = 'Sony WH-1000XM5',
  candidates = [
    { source: "Macy's", color: '#f85149', price: '$248.00', loser: true },
    { source: 'Costco', color: '#3fb950', price: '$162.97' },
  ],
  accent = ACCENT,
}: {
  title?: string;
  candidates?: Cand[];
  accent?: string;
}) {
  const winner = candidates.find((c) => !c.loser) ?? candidates[candidates.length - 1];

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Same dedup_key → collapse, keep cheapest
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* two candidates that share a key */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 200px', minWidth: 190 }}>
          {candidates.map((c, i) => (
            <motion.div
              key={c.source}
              style={{ ...card }}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.5 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 220, damping: 22 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{title}</span>
                <span style={{ position: 'relative', marginLeft: 'auto', fontFamily: MONO, fontSize: 13, color: c.loser ? '#8b98a8' : accent, fontWeight: 700 }}>
                  {c.price}
                  {c.loser && (
                    <motion.span
                      style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: '#f85149', transformOrigin: 'left' }}
                      animate={{ scaleX: [0, 1, 1, 0] }}
                      transition={{ duration: 3, times: [0, 0.25, 0.85, 1], repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: c.color, marginTop: 3 }}>from {c.source}</div>
            </motion.div>
          ))}
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', textAlign: 'center' }}>
            dedup_key: title_brand(title)|normalize(title) — identical
          </div>
        </div>

        {/* collapse arrow */}
        <motion.div
          style={{ fontFamily: MONO, fontSize: 20, color: accent, flex: '0 0 auto' }}
          animate={{ x: [-2, 3, -2], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >→</motion.div>

        {/* the single kept row */}
        <motion.div
          style={{ ...card, flex: '1 1 180px', minWidth: 170, borderColor: `${accent}73`, background: `${accent}10` }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ amount: 0.5 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <motion.span
              style={{ color: accent, fontWeight: 700 }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >✓</motion.span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{title}</span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 14, color: accent, fontWeight: 700 }}>{winner.price}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 3 }}>
            one row · {winner.source} · cheapest wins
          </div>
        </motion.div>
      </div>
    </div>
  );
}
