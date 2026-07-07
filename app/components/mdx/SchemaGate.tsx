'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of structured output as a schema gate: the LLM's JSON must
 * validate against a typed schema or it's rejected (and retried). One valid
 * payload passes green; one with a wrong-typed field is bounced red. This is the
 * difference between "asked for JSON" and "guaranteed typed data". Static-safe.
 */

const CANDIDATES = [
  { json: '{ "brand": "Sony", "model": "WH-1000XM5", "condition": "new" }', ok: true, note: 'types match → accepted' },
  { json: '{ "brand": 42, "model": "WH-1000XM5", "condition": "new" }', ok: false, note: 'brand not str → rejected' },
  { json: '{ "brand": "Bose", "model": "QC45", "condition": "maybe" }', ok: false, note: 'condition invalid literal → rejected' },
];

export default function SchemaGate({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        The schema is a gate
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        brand: str|null · model: str|null · condition: &quot;new&quot;|&quot;refurb&quot;|&quot;used&quot; · category: str|null
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CANDIDATES.map((c, i) => {
          const col = c.ok ? '#3fb950' : '#f85149';
          return (
            <motion.div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.25 }}
            >
              <code style={{ fontFamily: MONO, fontSize: 12, color: '#cdd7e2', flex: '1 1 220px', minWidth: 200 }}>{c.json}</code>
              {/* the gate */}
              <motion.span
                style={{ fontFamily: MONO, fontSize: 10, color: accent, border: `1px solid ${accent}59`, borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap' }}
                animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.8, repeat: Infinity }}
              >validate()</motion.span>
              <span style={{ color: accent }}>→</span>
              <motion.span
                style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: col, border: `1px solid ${col}73`, background: `${col}14`, borderRadius: 7, padding: '5px 10px', whiteSpace: 'nowrap' }}
                animate={c.ok ? { scale: [1, 1.05, 1] } : { x: [0, -3, 3, -2, 2, 0] }}
                transition={c.ok ? { duration: 2, repeat: Infinity } : { duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                {c.ok ? '✓' : '✕'} {c.note}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        &quot;Asked for JSON&quot; ≠ &quot;guaranteed typed data&quot; — the schema is what makes it <span style={{ color: accent }}>structured</span> output. Bad field type or invalid literal: rejected before it enters the pipeline.
      </div>
    </div>
  );
}
