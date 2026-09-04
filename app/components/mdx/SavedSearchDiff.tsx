'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * SavedSearchDiff — bespoke animation for Part 29 (Saved searches & the suggestions worker).
 *
 * Metaphor: a sliding diff window. The left column shows the catalog of deals
 * found for a saved query; the right column shows only the *new* ones after
 * diffing against the last-seen state. Items that were already seen fade out;
 * the genuinely new one glows and fires a notification badge.
 *
 * All values are pinned from the electronics-2026-07 snapshot and the real
 * run_suggestions() output (wave7-ground-truth.md). Static-export-safe: all text
 * is in the DOM; Framer Motion animates on viewport entry only.
 *
 * First run: fresh SuggestionState() → Anker Q20i surfaces → 1 notification.
 * Second run: state fed back → 0 notifications (idempotent, greys out).
 */

type DealRow = {
  id: string;
  label: string;
  price: string;
  score: string;
  verdict: 'deal' | 'fair' | 'suspicious' | 'overpriced';
  alreadySeen: boolean; // in first run, none are seen; in second run all are
};

const DEALS: DealRow[] = [
  {
    id: 'anker',
    label: 'Anker Soundcore Q20i',
    price: '$44.99',
    score: '+0.7239',
    verdict: 'deal',
    alreadySeen: false, // the hero — new on first run
  },
  {
    id: 'sony-xm5',
    label: 'Sony WH-1000XM5',
    price: '$162.97',
    score: '+0.000',
    verdict: 'fair',
    alreadySeen: true, // already seen — filtered out (below threshold illustration)
  },
  {
    id: 'bose-qc45',
    label: 'Bose QuietComfort 45',
    price: '$46.00',
    score: '−0.282', // blended deal score: median signal +0.718 DEMOTED by the residual guard
    verdict: 'suspicious',
    alreadySeen: true, // flagged suspicious — blended score falls below threshold
  },
];

const VERDICT_COLOR: Record<string, string> = {
  deal: '#94bce3',
  fair: '#58a6ff',
  suspicious: '#d29922',
  overpriced: '#8b98a8',
};

function DealCard({
  row,
  dim,
  delay,
  isNew,
}: {
  row: DealRow;
  dim: boolean;
  delay: number;
  isNew: boolean;
}) {
  const vc = VERDICT_COLOR[row.verdict];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: dim ? 0.28 : 1, y: 0 }}
      viewport={{ amount: 0.3 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        fontFamily: MONO,
        fontSize: 11,
        border: `1px solid ${isNew ? vc + '88' : 'rgba(148,163,184,0.14)'}`,
        background: isNew ? `${vc}14` : 'rgba(13,17,23,0.3)',
        color: dim ? '#4a5568' : '#cdd7e2',
        position: 'relative',
      }}
    >
      {isNew && (
        <motion.span
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: delay + 0.3, type: 'spring', stiffness: 300 }}
          style={{
            position: 'absolute',
            top: -7,
            right: -7,
            background: '#94bce3',
            color: '#1d1f20',
            borderRadius: 20,
            fontSize: 8,
            fontWeight: 800,
            padding: '2px 5px',
            letterSpacing: '0.06em',
          }}
        >
          NEW
        </motion.span>
      )}
      <span style={{ color: vc, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, minWidth: 68 }}>
        {row.verdict}
      </span>
      <span style={{ flex: 1 }}>{row.label}</span>
      <span style={{ color: dim ? '#4a5568' : '#cdd7e2' }}>{row.price}</span>
      <span style={{ color: vc }}>{row.score}</span>
    </motion.div>
  );
}

function RunPanel({
  title,
  subtitle,
  showNew,
  notifCount,
  accent,
}: {
  title: string;
  subtitle: string;
  showNew: boolean;
  notifCount: number;
  accent: string;
}) {
  return (
    <div style={{ flex: '1 1 220px', minWidth: 200 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: MONO, fontSize: 9, color: '#596070', marginBottom: 10 }}>{subtitle}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DEALS.map((row, i) => {
          const dim = !showNew && row.alreadySeen;
          const isNew = showNew && !row.alreadySeen;
          // On run 2 everything is already seen → all dim, isNew always false
          const dimRun2 = !showNew;
          return (
            <DealCard
              key={row.id}
              row={row}
              dim={dimRun2 ? true : dim}
              delay={0.1 + i * 0.1}
              isNew={dimRun2 ? false : isNew}
            />
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.3 }}
        transition={{ delay: 0.55 }}
        style={{
          marginTop: 12,
          fontFamily: MONO,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ color: accent, fontWeight: 700 }}>
          {notifCount} notification{notifCount !== 1 ? 's' : ''}
        </span>
        {notifCount === 0 && (
          <span style={{ color: '#596070' }}>— idempotent</span>
        )}
      </motion.div>
    </div>
  );
}

export default function SavedSearchDiff({ accent = ACCENT }: { accent?: string }) {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '20px 18px',
        margin: '24px 0',
        background: 'rgba(13,17,23,0.4)',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: accent,
          marginBottom: 4,
        }}
      >
        run_suggestions() — diff against last-seen
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        saved: &ldquo;noise cancelling headphones&rdquo; · DEAL_SCORE_THRESHOLD = 0.30
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' as const, alignItems: 'flex-start' }}>
        <RunPanel
          title="Run 1 — fresh SuggestionState()"
          subtitle="seen = {} · Anker Q20i has no prior record"
          showNew={true}
          notifCount={1}
          accent={accent}
        />

        <motion.div
          style={{ alignSelf: 'center', color: accent, fontFamily: MONO, fontSize: 22, padding: '0 4px' }}
          animate={{ x: [-2, 3, -2], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          →
        </motion.div>

        <RunPanel
          title="Run 2 — feed back returned state"
          subtitle="seen = {anker-id} · no new deals"
          showNew={false}
          notifCount={0}
          accent={accent}
        />
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#596070', marginTop: 16 }}>
        <span style={{ color: '#94bce3' }}>Anker Q20i $44.99</span> score +0.7239 ≥ 0.30 → DEAL ·
        {' '}<span style={{ color: '#d29922' }}>Bose QC45</span> median signal +0.718 but blended −0.282 (SUSPICIOUS, residual guard) ·
        {' '}Sony XM5 score 0.000 &lt; threshold
      </div>
    </div>
  );
}
