'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke capstone illustration: the whole DealFinder system, layered. A request
 * descends from the interfaces through the agent and its capabilities to the
 * data, wrapped by the cross-cutting ops band. Reveals layer by layer; a flow
 * pulse runs the stack. Static-safe.
 */

const LAYERS = [
  { tag: 'interfaces', items: ['Web/API', 'MCP', 'Claude Code'], part: '9,12' },
  { tag: 'orchestration', items: ['ReAct Agent'], part: '8' },
  { tag: 'capabilities', items: ['Semantic search', 'Price model', 'Recommender', 'Extraction'], part: '3–6' },
  { tag: 'data', items: ['Catalog · vectors · store'], part: '1' },
];
const OPS = ['Guardrails (10)', 'Eval gate (11)', 'CI/CD · Serve (12–13)', 'Cost · Drift (14)'];

export default function SystemMap({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        The whole system, one diagram
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* main stack */}
        <div style={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LAYERS.map((l, i) => (
            <motion.div
              key={l.tag}
              style={{ border: `1px solid ${accent}40`, background: `${accent}0a`, borderRadius: 9, padding: '9px 12px' }}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: i * 0.15 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: accent, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{l.tag}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>part {l.part}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {l.items.map((it) => (
                  <span key={it} style={{ fontFamily: MONO, fontSize: 10.5, color: '#cdd7e2', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, padding: '3px 7px' }}>{it}</span>
                ))}
              </div>
              {i < LAYERS.length - 1 && (
                <motion.div
                  style={{ textAlign: 'center', color: accent, fontSize: 11, marginTop: 2, marginBottom: -4 }}
                  animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
                >↓</motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* cross-cutting ops band */}
        <motion.div
          style={{ flex: '1 1 150px', minWidth: 150, border: `1px dashed ${accent}59`, borderRadius: 9, padding: '10px 12px', background: `${accent}06`, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}
          initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.5 }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>cross-cutting ops</div>
          {OPS.map((o, i) => (
            <motion.div
              key={o}
              style={{ fontFamily: MONO, fontSize: 10.5, color: '#cdd7e2', display: 'flex', alignItems: 'center', gap: 6 }}
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />{o}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        Every box is a part you built and tested. <span style={{ color: accent }}>That</span> is what you walk into the interview with.
      </div>
    </div>
  );
}
