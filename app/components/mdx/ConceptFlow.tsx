'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Reusable animated concept illustration: several inputs flow through one hub
 * (a transform/interface) and converge into a single output. Framer Motion:
 * staggered in-view reveal + looping flow dots + a pulsing hub. Static-safe,
 * accessible (real text in the DOM). Drive it from MDX:
 *
 *   <ConceptFlow
 *     label="One interface, many sources"
 *     inputs={[{ label: 'Dataset', sub: '{ sku, name }', color: '#3fb950' }, …]}
 *     hub={{ label: 'DealSource', sub: 'normalize()' }}
 *     output={{ label: 'Product', sub: 'id · title · price' }}
 *   />
 *
 * Works for adapters, hybrid-search fusion, RAG retrieval, ingest/dedup, etc.
 */

type Node = { label: string; sub?: string; color?: string };

const card = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 10,
  background: 'rgba(148,163,184,0.05)',
  padding: '9px 12px',
};

function FlowDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 28 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'block' }}
          animate={{ opacity: [0.15, 1, 0.15] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function ConceptFlow({
  label,
  inputs,
  hub,
  output,
  accent = ACCENT,
}: {
  label?: string;
  inputs: Node[];
  hub: Node;
  output: Node;
  accent?: string;
}) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      {label && (
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
          {label}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* inputs */}
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '1 1 200px', minWidth: 180 }}
          initial="hidden"
          whileInView="show"
          viewport={{ amount: 0.5 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {inputs.map((s) => (
            <motion.div
              key={s.label}
              style={card}
              variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: s.sub ? 4 : 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color || accent }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{s.label}</span>
              </div>
              {s.sub && <code style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>{s.sub}</code>}
            </motion.div>
          ))}
        </motion.div>

        {/* inputs → hub flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: '0 1 60px' }}>
          {inputs.map((s) => <FlowDots key={s.label} color={s.color || accent} />)}
        </div>

        {/* hub */}
        <motion.div
          style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ amount: 0.5 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 18 }}
        >
          <motion.div
            style={{ border: `1.5px solid ${accent}`, color: accent, fontFamily: MONO, fontSize: 12, fontWeight: 600,
                     borderRadius: 999, padding: '10px 16px', background: `${accent}14`, whiteSpace: 'nowrap' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {hub.label}
          </motion.div>
          {hub.sub && <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>{hub.sub}</span>}
        </motion.div>

        {/* hub → output flow */}
        <FlowDots color={accent} />

        {/* output */}
        <motion.div
          style={{ ...card, flex: '1 1 200px', minWidth: 180, borderColor: `${accent}73`, background: `${accent}10` }}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.5 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 220, damping: 22 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: output.sub ? 5 : 0 }}>
            <motion.span
              style={{ color: accent, fontWeight: 700 }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >✓</motion.span>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{output.label}</span>
          </div>
          {output.sub && (
            <code style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', lineHeight: 1.5, display: 'block', whiteSpace: 'pre-line' }}>
              {output.sub}
            </code>
          )}
        </motion.div>
      </div>
    </div>
  );
}
