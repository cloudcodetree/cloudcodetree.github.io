'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of defense-in-depth: a request passes through ordered
 * guardrails — input checks, injection filter, the model, output validation, PII
 * redaction, audit log. A token descends the stack, each layer lighting as it
 * passes. Static-safe.
 */

const LAYERS = [
  { name: 'input validation', note: 'shape & ranges', kind: 'guard' },
  { name: 'injection filter', note: 'detect_prompt_injection()', kind: 'guard' },
  { name: 'the model', note: 'LLM call', kind: 'model' },
  { name: 'output validation', note: 'schema + ranges', kind: 'guard' },
  { name: 'PII redaction', note: 'redact before logging', kind: 'guard' },
  { name: 'audit log', note: 'who did what', kind: 'guard' },
];

export default function GuardrailStack({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Defense in depth
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 460 }}>
        {LAYERS.map((l, i) => {
          const model = l.kind === 'model';
          const col = model ? '#a371f7' : accent;
          return (
            <motion.div
              key={l.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8, padding: '9px 12px',
                border: `1px solid ${col}59`, background: `${col}0d`,
              }}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: i * 0.1 }}
            >
              <motion.span
                style={{ width: 8, height: 8, borderRadius: '50%', background: col, flex: '0 0 auto' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: LAYERS.length * 0.4, repeat: Infinity, delay: i * 0.4 }}
              />
              <span style={{ fontFamily: MONO, fontSize: 12, color: '#fff', flex: '0 0 auto', width: 130 }}>{l.name}</span>
              <code style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>{l.note}</code>
              {model && <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9, color: '#a371f7' }}>untrusted ↑↓</span>}
            </motion.div>
          );
        })}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        Every layer is cheap; skipping one is how incidents happen. The model sits in the <span style={{ color: '#a371f7' }}>middle</span>, never at the edge.
      </div>
    </div>
  );
}
