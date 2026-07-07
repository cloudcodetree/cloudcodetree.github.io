'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the three things an MCP server exposes — tools,
 * resources, prompts — and who controls each. Three labeled cards with a real
 * DealFinder example in each. Static-safe.
 */

const PRIMS = [
  { name: 'Tools', who: 'model-controlled', desc: 'actions the model can call', ex: 'score_deal(product_id)', color: '#3fb950' },
  { name: 'Resources', who: 'app-controlled', desc: 'data the app can read', ex: 'dealfinder://catalog/stats', color: '#2f81f7' },
  { name: 'Prompts', who: 'user-controlled', desc: 'reusable templates', ex: 'find_a_deal("headphones")', color: '#d29922' },
];

export default function MCPPrimitives({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        What an MCP server exposes
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {PRIMS.map((p, i) => (
          <motion.div
            key={p.name}
            style={{ flex: '1 1 160px', minWidth: 150, border: `1px solid ${p.color}59`, background: `${p.color}0d`, borderRadius: 10, padding: '12px 14px' }}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 240, damping: 22 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.name}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: p.color, marginBottom: 6 }}>{p.who}</div>
            <div style={{ fontSize: 12, color: '#cdd7e2', marginBottom: 8, lineHeight: 1.4 }}>{p.desc}</div>
            <code style={{ fontFamily: MONO, fontSize: 10.5, color: '#8b98a8' }}>{p.ex}</code>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
