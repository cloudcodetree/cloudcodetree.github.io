'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for the adapter / normalization concept: three sources
 * each use DIFFERENT raw field names, and the adapter maps every one of them
 * onto a single canonical field. This is what normalization actually *is* —
 * reconciling names — so the visual is a mapping matrix, not a generic flow.
 *
 * Each canonical field (right) is fed by one differently-named alias per source
 * (left). Connector arrows draw in on scroll, the canonical column glows.
 * Static-safe: every name is real text in the DOM.
 */

const SRC = [
  { key: 'rapidapi', label: 'RapidAPI', color: '#3fb950' },
  { key: 'apify', label: 'Apify', color: '#2f81f7' },
  { key: 'bestbuy', label: 'Best Buy', color: '#d29922' },
];

// canonical field ← the alias each source happens to call it
// (real field names from live_sources.py + Best Buy API)
const ROWS = [
  { canon: 'id', aliases: ['product_id', 'itemId', 'sku'] },
  { canon: 'title', aliases: ['product_title', 'title', 'name'] },
  { canon: 'price', aliases: ['price', 'priceNumeric', 'salePrice'] },
];

const chip = {
  fontFamily: MONO,
  fontSize: 12,
  padding: '5px 9px',
  borderRadius: 7,
  textAlign: 'center' as const,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(148,163,184,0.05)',
  color: '#cdd7e2',
  whiteSpace: 'nowrap' as const,
};

export default function SchemaMap({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)', overflowX: 'auto' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Raw field names → one schema
      </div>

      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(72px,1fr)) 28px minmax(96px,1.1fr)', gap: '10px 12px', alignItems: 'center', minWidth: 460 }}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.4 }}
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {/* header: source names + canonical */}
        {SRC.map((s) => (
          <motion.div
            key={s.key}
            variants={{ hidden: { opacity: 0, y: -8 }, show: { opacity: 1, y: 0 } }}
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: s.color, textAlign: 'center', fontWeight: 700 }}
          >
            {s.label}
          </motion.div>
        ))}
        <div />
        <motion.div
          variants={{ hidden: { opacity: 0, y: -8 }, show: { opacity: 1, y: 0 } }}
          style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: accent, textAlign: 'center', fontWeight: 700 }}
        >
          Product
        </motion.div>

        {/* one row per canonical field */}
        {ROWS.map((row) => (
          <RowCells key={row.canon} row={row} accent={accent} />
        ))}
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        RapidAPI, Apify, and Best Buy each name the same concept differently. <span style={{ color: accent }}>to_products()</span> maps every alias onto one canonical <span style={{ color: accent }}>Product</span> field.
      </div>
    </div>
  );
}

function RowCells({ row, accent }: { row: { canon: string; aliases: string[] }; accent: string }) {
  return (
    <>
      {row.aliases.map((alias, i) => (
        <motion.div
          key={i}
          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
          style={{ ...chip, borderColor: `${SRC[i].color}55` }}
        >
          {alias}
        </motion.div>
      ))}
      {/* converging arrow */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}
      >
        <motion.span
          style={{ fontFamily: MONO, fontSize: 16 }}
          animate={{ x: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >→</motion.span>
      </motion.div>
      {/* canonical field — the one clean shape */}
      <motion.div
        variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
        style={{ ...chip, borderColor: `${accent}73`, background: `${accent}12`, color: '#fff', fontWeight: 700 }}
      >
        {row.canon}
      </motion.div>
    </>
  );
}
