'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of agentic RAG: retrieval as a repeated, judged tool call.
 * The real "cheap monitor" trajectory (agentic_rag.agentic_answer, frozen
 * snapshot): 3 hops, the sufficiency gate fails two different ways, then converges
 * on a strong in-category DEAL set. Static/hydration-safe — animation is
 * opacity/transform on <div>s only.
 */

const GREEN = '#3fb950';
const RED = '#f85149';
const OVER = '#8b98a8';
const AMBER = '#f0a30a';

function vColor(v: string): string {
  if (v === 'deal') return GREEN;
  if (v === 'suspicious') return AMBER;
  if (v === 'overpriced') return OVER;
  return '#8b98a8';
}

// Real hops from agentic_answer("cheap monitor")
const HOPS = [
  { q: 'cheap monitor', verdicts: ['overpriced', 'deal', 'overpriced', 'deal', 'overpriced'], ok: false, why: 'top result is OVERPRICED, not a DEAL' },
  { q: 'monitor gaming deal', verdicts: ['deal', 'overpriced', 'overpriced', 'overpriced', 'overpriced'], ok: false, why: 'only 1 DEAL in top-5 — too thin' },
  { q: 'monitor hdr gaming deal', verdicts: ['deal', 'deal', 'overpriced', 'deal', 'overpriced'], ok: true, why: '3 DEALs, top is a DEAL, 0 traps' },
];

export default function AgenticLoop({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        Agentic RAG — retrieve · judge · reformulate · retry
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {HOPS.map((h, i) => (
          <motion.div
            key={h.q}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: i * 0.15 }}
          >
            <div
              style={{
                padding: '10px 12px', borderRadius: 9,
                border: `1px solid ${h.ok ? GREEN : 'rgba(148,163,184,0.2)'}55`,
                background: h.ok ? 'rgba(63,185,80,0.06)' : 'rgba(148,163,184,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: OVER }}>hop {i + 1}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#fff' }}>retrieve(<span style={{ color: accent }}>&quot;{h.q}&quot;</span>)</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 7, flexWrap: 'wrap' }}>
                {h.verdicts.map((v, j) => (
                  <span key={j} title={v} style={{ width: 34, height: 8, borderRadius: 3, background: vColor(v), opacity: 0.85 }} />
                ))}
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: h.ok ? GREEN : RED, marginLeft: 8 }}>
                  {h.ok ? '✓ sufficient' : '✗ insufficient'}
                </span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: h.ok ? GREEN : AMBER, marginTop: 4 }}>{h.why}</div>
            </div>
            {!h.ok && (
              <div style={{ fontFamily: MONO, fontSize: 10, color: accent, textAlign: 'center', padding: '3px 0' }}>
                ↓ reformulate — expand with a corpus capability term
              </div>
            )}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 4, padding: '10px 12px', borderRadius: 9, border: `1px solid ${GREEN}66`, background: 'rgba(63,185,80,0.08)' }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: GREEN, marginBottom: 3 }}>grounded answer</div>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: '#cdd7e2', lineHeight: 1.6 }}>
            Best value: <b style={{ color: '#fff' }}>MSI Pro MP273U 27&quot; 4K UHD HDR Monitor</b> at <b style={{ color: GREEN }}>$159.99</b> (47% under the same-query median).
          </div>
        </motion.div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: OVER, marginTop: 12 }}>
        Each bar is one retrieved listing&apos;s verdict: <span style={{ color: GREEN }}>DEAL</span> · <span style={{ color: AMBER }}>SUSPICIOUS</span> · <span style={{ color: OVER }}>OVERPRICED</span>.
        The gate reads the verdicts; a weak hop triggers another retrieval.
      </div>
    </div>
  );
}
