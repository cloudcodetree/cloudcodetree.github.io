'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of hybrid retrieval + Reciprocal Rank Fusion: a semantic
 * ranking and a keyword (BM25) ranking are merged into one. Items that rank well
 * in BOTH float to the top of the fused list — the whole point of RRF. Consensus
 * items are highlighted; the fused column assembles last. Static-safe.
 */

const SEMANTIC = ['tent-13', 'tent-04', 'tent-03'];
const KEYWORD = ['tent-04', 'tent-07', 'tent-13'];
const FUSED = ['tent-04', 'tent-13', 'tent-21'];
const consensus = new Set(['tent-04', 'tent-13']); // in both source lists

function List({ title, items, accent, delay = 0 }: { title: string; items: string[]; accent: string; delay?: number }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 110 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((it, i) => {
          const hot = consensus.has(it);
          return (
            <motion.div
              key={it}
              style={{
                fontFamily: MONO, fontSize: 11, padding: '5px 8px', borderRadius: 6,
                color: hot ? '#fff' : '#cdd7e2',
                border: `1px solid ${hot ? `${accent}73` : 'rgba(148,163,184,0.18)'}`,
                background: hot ? `${accent}14` : 'rgba(148,163,184,0.04)',
              }}
              initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: delay + i * 0.08 }}
            >
              <span style={{ color: '#8b98a8' }}>{i + 1}.</span> {it}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function HybridFusion({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Two retrievers → one ranking (RRF)
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <List title="semantic" items={SEMANTIC} accent={accent} />
        <List title="keyword (BM25)" items={KEYWORD} accent={accent} delay={0.2} />

        <motion.div
          style={{ alignSelf: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: accent, border: `1.5px solid ${accent}`, background: `${accent}14`, borderRadius: 999, padding: '8px 12px', whiteSpace: 'nowrap' }}
          animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
        >
          RRF →
        </motion.div>

        <div style={{ flex: '1 1 130px', minWidth: 120 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: accent, marginBottom: 6 }}>fused</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {FUSED.map((it, i) => (
              <motion.div
                key={it}
                style={{
                  fontFamily: MONO, fontSize: 11, padding: '5px 8px', borderRadius: 6, color: '#fff',
                  border: `1px solid ${consensus.has(it) ? `${accent}73` : 'rgba(148,163,184,0.25)'}`,
                  background: consensus.has(it) ? `${accent}1a` : 'rgba(148,163,184,0.06)',
                }}
                initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.7 + i * 0.12 }}
              >
                <span style={{ color: accent }}>{i + 1}.</span> {it}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        Items strong in <span style={{ color: '#cdd7e2' }}>both</span> lists rise to the top — no weights to tune.
      </div>
    </div>
  );
}
