'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of structured extraction: spans of a messy retailer-
 * polluted electronics title are pulled into typed fields. Each source span is
 * colour-coded and the matching field lights up in the same colour, so
 * "prose → typed JSON" is literal. Shows the dual-path (LLM / regex) funnel
 * converging to one validated schema shape. Static-safe (all text real).
 */

// The listing, segmented; highlighted spans carry a field colour.
// Title: "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Overhead Headphones"
// raw brand field in snapshot: "Costco" (retailer — hence the strike-through label)
const SEGMENTS: { t: string; field?: string; color?: string }[] = [
  { t: 'Sony', field: 'brand', color: '#2f81f7' },
  { t: ' ' },
  { t: 'WH-1000XM5', field: 'model', color: '#a371f7' },
  { t: ' Wireless Industry Leading Noise Canceling Overhead ' },
  { t: 'Headphones', field: 'category', color: '#3fb950' },
];

const FIELDS = [
  { k: 'brand', v: '"Sony"', color: '#2f81f7' },
  { k: 'model', v: '"WH-1000XM5"', color: '#a371f7' },
  { k: 'category', v: '"audio"', color: '#3fb950' },
  { k: 'condition', v: '"new"', color: '#d29922' },
];

export default function ExtractFlow({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Retailer-polluted title → typed JSON
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        raw brand in snapshot: <span style={{ color: '#f85149', textDecoration: 'line-through' }}>&quot;Costco&quot;</span>
        <span style={{ color: '#8b98a8' }}> → extracted: </span>
        <span style={{ color: '#2f81f7' }}>&quot;Sony&quot;</span>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* the listing with highlighted spans */}
        <div style={{ flex: '1 1 240px', minWidth: 230, fontFamily: MONO, fontSize: 13, lineHeight: 1.9, color: '#8b98a8' }}>
          {SEGMENTS.map((s, i) =>
            s.field ? (
              <motion.span
                key={i}
                style={{ color: '#fff', background: `${s.color}22`, border: `1px solid ${s.color}73`, borderRadius: 5, padding: '2px 5px', whiteSpace: 'nowrap' }}
                initial={{ opacity: 0.3 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12 }}
              >{s.t}</motion.span>
            ) : (
              <span key={i}>{s.t}</span>
            ),
          )}
        </div>

        {/* dual-path funnel: LLM primary / regex fallback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto', alignItems: 'center' }}>
          <motion.div
            style={{ fontFamily: MONO, fontSize: 10, color: accent, border: `1px solid ${accent}59`, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.8, repeat: Infinity }}
          >llm_extract</motion.div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>↕ fallback</div>
          <motion.div
            style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', border: '1px dashed #8b98a850', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2.2, repeat: Infinity }}
          >rule_extract</motion.div>
          <motion.div
            style={{ color: accent, fontFamily: MONO, fontSize: 18 }}
            animate={{ x: [-2, 3, -2], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}
          >→</motion.div>
        </div>

        {/* typed fields — same shape from both paths */}
        <div style={{ flex: '1 1 200px', minWidth: 200, fontFamily: MONO, fontSize: 12, border: `1px solid ${accent}40`, borderRadius: 10, padding: '12px 14px', background: 'rgba(148,163,184,0.04)' }}>
          <div style={{ color: '#8b98a8' }}>ListingSpecs {'{'}</div>
          {FIELDS.map((f, i) => (
            <motion.div
              key={f.k}
              style={{ paddingLeft: 14 }}
              initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.6 + i * 0.15 }}
            >
              <span style={{ color: '#8b98a8' }}>{f.k}:</span> <span style={{ color: f.color, fontWeight: 700 }}>{f.v}</span>
            </motion.div>
          ))}
          <div style={{ color: '#8b98a8' }}>{'}'}</div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        Two input tubes (LLM / regex), one validated output shape — same <span style={{ color: accent }}>ListingSpecs</span> contract both ways.
      </div>
    </div>
  );
}
