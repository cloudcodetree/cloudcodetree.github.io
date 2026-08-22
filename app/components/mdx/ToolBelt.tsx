'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of an agent's tools + human-in-the-loop: the agent
 * dispatches freely to read-only tools, but a state-changing tool sits behind a
 * 🔒 approval gate that pauses for a human. Read tools pulse green as "callable";
 * the gated tool shows a paused approval. Static-safe.
 */

const READ_TOOLS = [
  { name: 'sql_search', desc: 'NL → SQL filter' },
  { name: 'semantic_search', desc: 'embeddings' },
  { name: 'score_deal', desc: 'fair-price model' },
  { name: 'recommend', desc: 'you-may-like' },
];

export default function ToolBelt({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Tools — and a human gate on risky ones
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* agent */}
        <motion.div
          style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: accent, border: `1.5px solid ${accent}`, background: `${accent}14`, borderRadius: 999, padding: '12px 16px' }}
          animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
        >
          agent
        </motion.div>

        <motion.span style={{ color: accent, fontSize: 16 }} animate={{ x: [-2, 3, -2], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>→</motion.span>

        {/* read-only tools */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: 8, flex: '1 1 280px' }}>
          {READ_TOOLS.map((t, i) => (
            <motion.div
              key={t.name}
              style={{ border: '1px solid rgba(148,188,227,0.4)', background: 'rgba(148,188,227,0.07)', borderRadius: 8, padding: '7px 10px' }}
              animate={{ borderColor: ['rgba(148,188,227,0.25)', 'rgba(148,188,227,0.7)', 'rgba(148,188,227,0.25)'] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff' }}>{t.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>{t.desc} · read-only</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* HITL gated tool */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>state-changing →</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#fff', border: '1px solid rgba(210,153,34,0.5)', background: 'rgba(210,153,34,0.08)', borderRadius: 8, padding: '7px 10px' }}>
          place_order
        </span>
        <motion.span
          style={{ fontFamily: MONO, fontSize: 11, color: '#d29922', border: '1px solid #d2992273', borderRadius: 8, padding: '7px 10px' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
        >
          🔒 awaiting human approval
        </motion.span>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        Reads run freely; anything that spends money or changes state stops for a human (HITL).
      </div>
    </div>
  );
}
