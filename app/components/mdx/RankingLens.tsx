'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the dual-signal retrieval problem: a query illuminates
 * each product card with two independent lights — a keyword spotlight (BM25 term
 * overlap, shown as yellow highlights on matching tokens) and a semantic halo
 * (dense embedding similarity, shown as a radial glow). Cards are sized by their
 * combined signal. The teaching point: Bose QC45 glows bright on the semantic
 * halo (embedding similarity to "noise cancelling") but dim on keyword overlap
 * because its title contains those exact words but ranks below XM5 on BM25
 * due to IDF saturation. Neither signal alone gives the right ranking — RRF
 * fuses them. Static-safe; all scores are hardcoded from the snapshot run.
 */

interface Card {
  label: string;
  price: string;
  badge: string;
  bm25: number;   // 0–1 normalized
  dense: number;  // 0–1 normalized
  matchTerms: string[];
}

const CARDS: Card[] = [
  {
    label: 'Sony WH-1000XM5',
    price: '$162.97',
    badge: 'FAIR',
    bm25: 0.92,
    dense: 0.81,
    matchTerms: ['noise', 'cancelling', 'headphones'],
  },
  {
    label: 'Anker Q20i',
    price: '$44.99',
    badge: 'DEAL',
    bm25: 0.71,
    dense: 0.76,
    matchTerms: ['noise', 'cancelling', 'headphones'],
  },
  {
    label: 'Bose QuietComfort 45',
    price: '$46',
    badge: 'SUSPICIOUS',
    bm25: 0.38,
    dense: 0.91,
    matchTerms: ['headphones'],
  },
  {
    label: 'Sony WH-1000XM6',
    price: '$399.99',
    badge: 'OVERPRICED',
    bm25: 0.55,
    dense: 0.72,
    matchTerms: ['noise', 'cancelling'],
  },
];

const BADGE_COLOR: Record<string, string> = {
  DEAL: '#94bce3',
  FAIR: '#60a5fa',
  SUSPICIOUS: '#f0a30a',
  OVERPRICED: '#8b98a8',
};

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
      <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', width: 52, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 3, background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 100}%` }}
          viewport={{ amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
        />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 9, color, width: 26, textAlign: 'right', flexShrink: 0 }}>
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

function ProductCard({ card, delay }: { card: Card; delay: number }) {
  const badgeColor = BADGE_COLOR[card.badge] ?? '#8b98a8';
  const hasSemantic = card.dense > 0.80;
  const glowColor = hasSemantic ? `${ACCENT}26` : 'transparent';

  return (
    <motion.div
      style={{
        flex: '1 1 160px',
        minWidth: 150,
        maxWidth: 210,
        borderRadius: 10,
        padding: '12px 12px 10px',
        border: `1px solid rgba(148,163,184,0.18)`,
        background: `radial-gradient(ellipse at 50% 0%, ${glowColor} 0%, rgba(13,17,23,0.45) 70%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3 }}
      transition={{ delay, duration: 0.35 }}
    >
      {/* semantic halo ring */}
      {hasSemantic && (
        <motion.div
          style={{
            position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
            width: 80, height: 40, borderRadius: '50%',
            background: `radial-gradient(ellipse, ${ACCENT}30 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, delay }}
        />
      )}

      <div style={{ fontFamily: MONO, fontSize: 10, color: '#cdd7e2', fontWeight: 600, marginBottom: 2, lineHeight: 1.35 }}>
        {card.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#fff', fontWeight: 700 }}>{card.price}</span>
        <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, color: badgeColor, letterSpacing: '0.06em' }}>{card.badge}</span>
      </div>

      {/* keyword match tokens */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
        {['noise', 'cancelling', 'headphones'].map(term => (
          <span
            key={term}
            style={{
              fontFamily: MONO, fontSize: 8, padding: '1px 5px', borderRadius: 3,
              background: card.matchTerms.includes(term) ? 'rgba(250,204,21,0.18)' : 'rgba(148,163,184,0.06)',
              color: card.matchTerms.includes(term) ? '#fbbf24' : '#64748b',
              border: `1px solid ${card.matchTerms.includes(term) ? 'rgba(251,191,36,0.3)' : 'transparent'}`,
            }}
          >
            {term}
          </span>
        ))}
      </div>

      <BarRow label="BM25" value={card.bm25} color="#fbbf24" />
      <BarRow label="dense" value={card.dense} color={ACCENT} />
    </motion.div>
  );
}

export default function RankingLens({ accent = ACCENT }: { accent?: string }) {
  void accent; // accent param reserved for future theming; component uses ACCENT constant
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
        Two signals, one query: &ldquo;noise cancelling headphones&rdquo;
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 16 }}>
        <span style={{ color: '#fbbf24' }}>yellow</span> = BM25 keyword match &nbsp;·&nbsp; <span style={{ color: ACCENT }}>blue halo</span> = dense embedding similarity
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {CARDS.map((c, i) => (
          <ProductCard key={c.label} card={c} delay={i * 0.1} />
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        Bose QC45 has the <span style={{ color: ACCENT }}>strongest semantic halo</span> but only one keyword match — it ranks #1 on dense alone.
        RRF fuses both signals so <span style={{ color: '#cdd7e2' }}>Sony XM5</span> (strong in both) rises to the top.
      </div>
    </div>
  );
}
