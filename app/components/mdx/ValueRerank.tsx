'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of reranking by value: the relevance-ranked list is
 * re-sorted by blending in each item's deal score, so a genuinely underpriced
 * result climbs. Two columns (before → after) with the deal item highlighted and
 * an upward arrow showing it moved. Real ordering from `run_search`. Static-safe.
 */

// (id, deal label, isDeal) — order = relevance (hybrid)
const BEFORE = [
  { id: 'tent-04', note: '14% over', deal: false },
  { id: 'tent-13', note: '1% over', deal: false },
  { id: 'tent-21', note: '8% over', deal: false },
  { id: 'tent-07', note: '8% over', deal: false },
  { id: 'tent-03', note: '27% under', deal: true },
];
// after value rerank: tent-03 climbs above tent-07
const AFTER = [
  { id: 'tent-04', note: '14% over', deal: false },
  { id: 'tent-13', note: '1% over', deal: false },
  { id: 'tent-21', note: '8% over', deal: false },
  { id: 'tent-03', note: '27% under', deal: true },
  { id: 'tent-07', note: '8% over', deal: false },
];

function Col({ title, items, accent }: { title: string; items: typeof BEFORE; accent: string }) {
  return (
    <div style={{ flex: '1 1 180px', minWidth: 170 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            layout
            style={{
              display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 11,
              padding: '6px 9px', borderRadius: 7,
              color: it.deal ? '#fff' : '#cdd7e2',
              border: `1px solid ${it.deal ? '#3fb95073' : 'rgba(148,163,184,0.18)'}`,
              background: it.deal ? 'rgba(63,185,80,0.12)' : 'rgba(148,163,184,0.04)',
            }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: i * 0.07 }}
          >
            <span style={{ color: '#8b98a8' }}>{i + 1}.</span>
            <span style={{ flex: 1 }}>{it.id}</span>
            <span style={{ color: it.deal ? '#3fb950' : '#8b98a8', fontSize: 10 }}>{it.note}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function ValueRerank({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Rerank by value — relevance + deal score
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <Col title="by relevance" items={BEFORE} accent={accent} />
        <motion.div
          style={{ alignSelf: 'center', color: accent, fontFamily: MONO, fontSize: 18 }}
          animate={{ x: [-2, 3, -2], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }}
        >→</motion.div>
        <Col title="reranked by value" items={AFTER} accent={accent} />
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        <span style={{ color: '#3fb950' }}>tent-03</span> (27% under fair) climbs — a relevant result that&apos;s also a real deal.
      </div>
    </div>
  );
}
