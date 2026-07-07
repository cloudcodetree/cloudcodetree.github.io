'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * NEW for Part 1 (electronics regen). Visualises the core normalization bug:
 * the raw `brand` field from Google Shopping is the RETAILER, not the
 * manufacturer. A single "brand" cell cracks open into two lanes:
 *   - left: what the snapshot's raw `brand` field says
 *   - right: what `title_brand(title)` extracts from the title
 *
 * A sliding cursor highlights the regex match boundary. Three real examples
 * from electronics-2026-07.json. Static-export-safe: all text in DOM.
 */

const PAIRS = [
  { raw: 'Walmart - COWIN', extracted: 'Cowin', dim: true },
  { raw: "Macy's",          extracted: 'Sony',  dim: false },
  { raw: 'mountainlifestyle.ca', extracted: 'Bose', dim: true },
];

const chip = (color: string, bg?: string) => ({
  fontFamily: MONO,
  fontSize: 12,
  padding: '5px 10px',
  borderRadius: 7,
  border: `1px solid ${color}66`,
  background: bg ?? `${color}14`,
  color: '#cdd7e2',
  whiteSpace: 'nowrap' as const,
});

export default function RetailerBrandSplit({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{
      border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14,
      padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)', overflowX: 'auto',
    }}>
      <div style={{
        fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: accent, marginBottom: 4,
      }}>
        Raw brand field → true manufacturer
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        154 of 270 snapshot rows: <span style={{ color: '#f85149' }}>brand = retailer</span>, not manufacturer
      </div>

      {/* column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: '8px 12px',
        alignItems: 'center', minWidth: 340, marginBottom: 6,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: '#f85149', fontWeight: 700, textAlign: 'center' }}>
          item[&quot;brand&quot;] raw
        </div>
        <div />
        <div style={{ fontFamily: MONO, fontSize: 11, color: accent, fontWeight: 700, textAlign: 'center' }}>
          title_brand(title)
        </div>
      </div>

      <motion.div
        style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 340 }}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.4 }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        {PAIRS.map((p, i) => (
          <motion.div
            key={p.raw}
            style={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: '8px 12px', alignItems: 'center' }}
            variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
          >
            {/* raw retailer cell */}
            <div style={{ ...chip('#f85149'), textAlign: 'center', opacity: p.dim ? 0.7 : 1 }}>
              {p.raw}
            </div>

            {/* animated cursor / arrow */}
            <motion.div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontFamily: MONO, fontSize: 15 }}
              animate={{ x: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            >
              →
            </motion.div>

            {/* extracted manufacturer cell */}
            <motion.div
              style={{ ...chip(accent, `${accent}18`), textAlign: 'center', color: '#fff', fontWeight: 700 }}
              animate={{ boxShadow: [`0 0 0px ${accent}00`, `0 0 8px ${accent}55`, `0 0 0px ${accent}00`] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            >
              {p.extracted}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        <span style={{ color: accent }}>title_brand()</span> is a greedy regex over ~70 known electronics manufacturers.
        No LLM. Deterministic. The raw <span style={{ color: '#f85149' }}>brand</span> field is never used for model features.
      </div>
    </div>
  );
}
