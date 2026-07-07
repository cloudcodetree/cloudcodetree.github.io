'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of reranking by value: the relevance-ranked list is
 * re-sorted by blending in each item's deal score, so a genuinely underpriced
 * result climbs. Two columns (before → after) with the deal item highlighted and
 * an upward arrow showing it moved. Real ordering from search_catalog(). Static-safe.
 *
 * Data: hero-cast headphones from the electronics-2026-07 snapshot.
 * After RRF the Bose QC45 at $46 ranks high on relevance; the value rerank
 * demotes it (suspicious residual) and promotes the Anker Q20i (honest deal).
 */

// (id, deal label, badge, isDeal) — order = RRF relevance (pre-value-rerank)
const BEFORE = [
  { id: 'Sony XM5 $162.97', note: 'FAIR', deal: false },
  { id: 'Bose QC45 $46', note: 'SUSPICIOUS', deal: false, warn: true },
  { id: 'Anker Q20i $44.99', note: 'DEAL', deal: true },
  { id: 'Sony XM6 $399.99', note: 'OVERPRICED', deal: false },
];
// after value rerank: Anker Q20i rises above Bose QC45 (residual guard demotes Bose)
const AFTER = [
  { id: 'Sony XM5 $162.97', note: 'FAIR', deal: false },
  { id: 'Anker Q20i $44.99', note: 'DEAL', deal: true },
  { id: 'Bose QC45 $46', note: 'SUSPICIOUS', deal: false, warn: true },
  { id: 'Sony XM6 $399.99', note: 'OVERPRICED', deal: false },
];

function badgeColor(note: string, deal: boolean): string {
  if (deal) return '#3fb950';
  if (note === 'SUSPICIOUS') return '#f0a30a';
  if (note === 'OVERPRICED') return '#8b98a8';
  return '#8b98a8';
}

function rowBorder(note: string, deal: boolean): string {
  if (deal) return '#3fb95073';
  if (note === 'SUSPICIOUS') return '#f0a30a55';
  return 'rgba(148,163,184,0.18)';
}

function rowBg(note: string, deal: boolean): string {
  if (deal) return 'rgba(63,185,80,0.12)';
  if (note === 'SUSPICIOUS') return 'rgba(240,163,10,0.08)';
  return 'rgba(148,163,184,0.04)';
}

function Col({ title, items, accent }: { title: string; items: typeof BEFORE; accent: string }) {
  return (
    <div style={{ flex: '1 1 200px', minWidth: 190 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            layout
            style={{
              display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 10,
              padding: '6px 9px', borderRadius: 7,
              color: it.deal ? '#fff' : '#cdd7e2',
              border: `1px solid ${rowBorder(it.note, it.deal)}`,
              background: rowBg(it.note, it.deal),
            }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: i * 0.07 }}
          >
            <span style={{ color: '#8b98a8' }}>{i + 1}.</span>
            <span style={{ flex: 1 }}>{it.id}</span>
            <span style={{ color: badgeColor(it.note, it.deal), fontSize: 9, fontWeight: 700 }}>{it.note}</span>
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
        <span style={{ color: '#3fb950' }}>Anker Q20i</span> (DEAL) rises — the residual guard demotes <span style={{ color: '#f0a30a' }}>Bose QC45</span> (SUSPICIOUS) despite similar price.
      </div>
    </div>
  );
}
