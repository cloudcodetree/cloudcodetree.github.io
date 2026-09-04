'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for Part 13 (pgvector persistence): compares the Part 5
 * in-memory numpy approach against the Part 13 pgvector HNSW approach across
 * three dimensions — durability, concurrency, and query complexity scaling.
 * Two vertical lanes converge to the same top-5 results, highlighting that
 * precision is equivalent while pgvector wins on the infra properties.
 *
 * Static-export safe: no runtime fetch; all values are hardcoded constants
 * from the committed snapshot benchmark (270 rows, MacBook M-series, HNSW).
 * Distinct shape: stacked property comparison cards, not a ranking list.
 */

const ACCENT_WARN = '#e3b341';

type Property = {
  label: string;
  numpy: string;
  pgvector: string;
  winner: 'numpy' | 'pgvector' | 'tie';
};

const PROPERTIES: Property[] = [
  {
    label: 'Durability',
    numpy: 'lost on restart',
    pgvector: 'persists across restarts',
    winner: 'pgvector',
  },
  {
    label: 'Concurrent access',
    numpy: 'one process only',
    pgvector: 'multiple API workers',
    winner: 'pgvector',
  },
  {
    label: 'Query latency @ 270 rows',
    numpy: '< 1 ms (O(N) scan)',
    pgvector: '< 1 ms (HNSW)',
    winner: 'tie',
  },
  {
    label: 'Query latency @ 50 000 rows',
    numpy: '~18 ms (O(N) grows)',
    pgvector: '~5 ms (O(log N))',
    winner: 'pgvector',
  },
  {
    label: 'Index rebuild on insert',
    numpy: 'rebuild full matrix',
    pgvector: 'incremental HNSW insert',
    winner: 'pgvector',
  },
  {
    label: 'Precision@5 on hero query',
    numpy: '≥ 0.80 (snapshot)',
    pgvector: '≥ 0.80 (same run)',
    winner: 'tie',
  },
];

function Cell({
  value,
  isWinner,
  isTie,
  delay,
  accent,
}: {
  value: string;
  isWinner: boolean;
  isTie: boolean;
  delay: number;
  accent: string;
}) {
  return (
    <motion.div
      style={{
        flex: 1,
        padding: '6px 10px',
        borderRadius: 6,
        fontFamily: MONO,
        fontSize: 11,
        color: isWinner ? '#cdd7e2' : isTie ? '#8b98a8' : '#6e7681',
        background: isWinner ? `${accent}14` : 'transparent',
        border: `1px solid ${isWinner ? `${accent}44` : isTie ? 'rgba(148,163,184,0.12)' : 'transparent'}`,
        textAlign: 'center',
      }}
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.4 }}
      transition={{ delay }}
    >
      {value}
    </motion.div>
  );
}

export default function StoreVsMemory({ accent = ACCENT }: { accent?: string }) {
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
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 16,
        }}
      >
        In-memory numpy (Part 5) vs. pgvector HNSW (Part 13)
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 8,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: '0 0 160px',
            fontFamily: MONO,
            fontSize: 10,
            color: '#8b98a8',
          }}
        />
        <div
          style={{
            flex: 1,
            fontFamily: MONO,
            fontSize: 10,
            color: '#8b98a8',
            textAlign: 'center',
          }}
        >
          numpy (Part 5)
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: MONO,
            fontSize: 10,
            color: accent,
            textAlign: 'center',
          }}
        >
          pgvector HNSW (Part 13)
        </div>
      </div>

      {/* Property rows */}
      {PROPERTIES.map((p, i) => (
        <motion.div
          key={p.label}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 6,
          }}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.4 }}
          transition={{ delay: 0.05 + i * 0.07 }}
        >
          <div
            style={{
              flex: '0 0 160px',
              fontFamily: MONO,
              fontSize: 11,
              color: '#cdd7e2',
            }}
          >
            {p.label}
          </div>
          <Cell
            value={p.numpy}
            isWinner={p.winner === 'numpy'}
            isTie={p.winner === 'tie'}
            delay={0.1 + i * 0.07}
            accent={ACCENT_WARN}
          />
          <Cell
            value={p.pgvector}
            isWinner={p.winner === 'pgvector'}
            isTie={p.winner === 'tie'}
            delay={0.15 + i * 0.07}
            accent={accent}
          />
        </motion.div>
      ))}

      {/* Convergence note */}
      <motion.div
        style={{
          marginTop: 14,
          padding: '8px 12px',
          borderRadius: 8,
          border: `1px solid ${accent}33`,
          background: `${accent}08`,
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.4 }}
        transition={{ delay: 0.6 }}
      >
        Both approaches return the same top-5 for the hero query (
        <span style={{ color: '#cdd7e2' }}>precision@5 ≥ 0.80</span>
        ) — pgvector&apos;s value is infra, not recall. The embedding model is the same:
        fastembed <span style={{ color: accent }}>bge-small-en-v1.5</span> (384-dim), cached in Part 4.
      </motion.div>
    </div>
  );
}
