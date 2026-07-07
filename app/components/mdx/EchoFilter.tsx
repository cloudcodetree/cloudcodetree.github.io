'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the dedup guard as applied inside the recommender:
 * the same product (Sony WH-1000XM5) appears at three retailer prices and
 * would dominate the top-k if not filtered. The guard collapses the three
 * reflections into one canonical card.
 *
 * Visual metaphor: three cards fan out from a single point (echo chamber),
 * then collapse back to the cheapest when the guard fires. Labels are real
 * hero-cast items from the electronics-2026-07 snapshot. Static-safe.
 */

const DUPES = [
  { label: 'XM5 @ $162.97', sub: 'Costco', canonical: true },
  { label: 'XM5 @ $248.00', sub: "Macy's", canonical: false },
];

const CANONICAL = { label: 'Sony WH-1000XM5', sub: '$162.97 · Costco (canonical)' };

export default function EchoFilter({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{
      border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14,
      padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)',
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Dedup guard: echo filter
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

        {/* Before: echo chamber — dupes fan out */}
        <div style={{ flex: '1 1 180px', minWidth: 160 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 8 }}>
            before guard — same product, 2 prices
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DUPES.map((d, i) => (
              <motion.div
                key={d.label}
                style={{
                  fontFamily: MONO, fontSize: 11, padding: '7px 10px', borderRadius: 8,
                  color: d.canonical ? '#fff' : '#8b98a8',
                  border: `1px solid ${d.canonical ? `${accent}60` : 'rgba(148,163,184,0.18)'}`,
                  background: d.canonical ? `${accent}10` : 'rgba(148,163,184,0.04)',
                  opacity: d.canonical ? 1 : 0.65,
                }}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: d.canonical ? 1 : 0.65, x: 0 }}
                viewport={{ amount: 0.3 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
              >
                <div>{d.label}</div>
                <div style={{ fontSize: 9, color: '#8b98a8', marginTop: 2 }}>{d.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guard arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <motion.div
            style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 700, color: accent,
              border: `1.5px solid ${accent}`, background: `${accent}14`,
              borderRadius: 999, padding: '6px 10px', whiteSpace: 'nowrap',
            }}
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            canonical_id →
          </motion.div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', textAlign: 'center', maxWidth: 80 }}>
            keep cheapest, drop rest
          </div>
        </div>

        {/* After: one canonical card */}
        <div style={{ flex: '1 1 180px', minWidth: 160 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: accent, marginBottom: 8 }}>
            after guard — one canonical listing
          </div>
          <motion.div
            style={{
              fontFamily: MONO, fontSize: 11, padding: '7px 10px', borderRadius: 8,
              color: '#fff',
              border: `1.5px solid ${accent}80`,
              background: `${accent}14`,
            }}
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <div>{CANONICAL.label}</div>
            <div style={{ fontSize: 9, color: '#8b98a8', marginTop: 2 }}>{CANONICAL.sub}</div>
          </motion.div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 8 }}>
            top-k is now five <span style={{ color: '#cdd7e2' }}>different</span> products
          </div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        Without this guard, the XM5 at $248 (Macy&#39;s) would take rank 1 with cosine sim 0.98 —
        {' '}<span style={{ color: '#cdd7e2' }}>your top-k is just the same product under different retailers.</span>
      </div>
    </div>
  );
}
