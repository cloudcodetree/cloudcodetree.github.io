'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the RAG faithfulness guard (rag.is_grounded).
 * The retrieved context is the ONLY evidence an answer may cite. Every $price in
 * a candidate answer is checked against the retrieved set: a price that was never
 * retrieved is a hallucination and the answer is rejected (grounded = False).
 *
 * Data: the real top-5 retrieved for "noise cancelling headphones under $150"
 * (rag.retrieve, electronics-2026-07 snapshot). The grounded answer cites
 * $44.99 / $129.99 / $46.00 — all present. The hallucinated answer cites the
 * Sennheiser Momentum 4 at $199.00 (the real test's example) — a product and
 * price no retrieved listing has → the guard fails it. Static/hydration-safe:
 * animation is opacity/transform on <div>s only (no SVG geometry attrs).
 */

// Real retrieved prices from rag.retrieve() — the allowed evidence set.
const RETRIEVED = ['44.99', '129.99', '89.95', '359.99', '46.00'];

const GREEN = '#3fb950';
const RED = '#f85149';
const AMBER = '#f0a30a';

function Price({ value, ok }: { value: string; ok: boolean }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontWeight: 700,
        color: ok ? GREEN : RED,
        borderBottom: `1.5px solid ${ok ? GREEN : RED}`,
        padding: '0 1px',
      }}
    >
      ${value}
    </span>
  );
}

export default function GroundingGuard({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        Faithfulness guard — every cited price must be in the retrieved set
      </div>

      {/* Retrieved evidence = allowed prices */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>
          retrieved context (the only evidence)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RETRIEVED.map((p, i) => (
            <motion.span
              key={p}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.4 }}
              transition={{ delay: i * 0.06 }}
              style={{
                fontFamily: MONO, fontSize: 11, color: '#cdd7e2', fontWeight: 700,
                padding: '4px 8px', borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(148,163,184,0.06)',
              }}
            >
              ${p}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Two candidate answers */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {/* Grounded */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.2 }}
          style={{
            flex: '1 1 240px', minWidth: 230, padding: '12px 13px', borderRadius: 9,
            border: `1px solid ${GREEN}55`, background: 'rgba(63,185,80,0.07)',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.7, color: '#cdd7e2' }}>
            Best value: Anker Soundcore Q20i at <Price value="44.99" ok />. Also
            consider Soundcore Space 2 at <Price value="129.99" ok />. Avoid the
            Bose QC45 at <Price value="46.00" ok /> — flagged SUSPICIOUS.
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: GREEN, marginTop: 10 }}>
            ✓ grounded = True — every price is in the set
          </div>
        </motion.div>

        {/* Hallucinated */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.35 }}
          style={{
            flex: '1 1 240px', minWidth: 230, padding: '12px 13px', borderRadius: 9,
            border: `1px solid ${RED}55`, background: 'rgba(248,81,73,0.06)',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.7, color: '#cdd7e2' }}>
            Best pick: the Sennheiser Momentum 4 at <Price value="199.00" ok={false} /> —
            it&apos;s the best value for the money.
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: RED, marginTop: 10 }}>
            ✗ grounded = False — <span style={{ color: AMBER }}>$199.00</span> was never retrieved
          </div>
        </motion.div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        <code style={{ color: accent }}>is_grounded()</code> extracts every <code>$X</code> from the answer and
        requires a matching retrieved price. The invented <code>$199.00</code> — and the product no listing
        names — fail the check. A hallucination can’t sneak past.
      </div>
    </div>
  );
}
