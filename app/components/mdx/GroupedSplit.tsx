'use client';

import { motion } from 'framer-motion';
import { MONO } from '../blogShared';

/**
 * GroupedSplit — dataset engineering Part 15.
 *
 * Visual metaphor: a **train/test fault line**.
 * 18 query buckets are shown as small cards; the animation draws a clean
 * vertical split dividing 14 train queries (left) from 4 test queries (right).
 * A "contamination" ghost row then tries to straddle the line and is blocked
 * (red flash + shake) to illustrate what a random row split would allow.
 *
 * Real numbers from grouped_split(seed=0) on electronics-2026-07 (Part 15):
 *   18 unique queries → 14 train / 4 test
 *   train_size = 210 rows, test_size = 60 rows
 *   train_queries.isdisjoint(test_queries) = True
 *
 * Static-export-safe: no runtime fetch; Framer Motion only.
 */

// The 18 real snapshot queries (from data/snapshots/electronics-2026-07.json)
const ALL_QUERIES = [
  'noise cancelling headphones',
  'gaming laptop',
  'ultrawide monitor',
  'mechanical keyboard',
  'webcam',
  'external SSD',
  'wireless mouse',
  'portable bluetooth speaker',
  'smart home hub',
  'graphics card',
  'tablet',
  'gaming headset',
  'USB hub',
  'standing desk mat',
  'streaming microphone',
  'portable charger',
  'smart watch',
  'LED desk lamp',
];

// grouped_split(seed=0): last 4 in random order become test
// (exact split confirmed from ground-truth run)
const TEST_QUERIES = new Set([
  'streaming microphone',
  'portable charger',
  'smart watch',
  'LED desk lamp',
]);

const TRAIN = ALL_QUERIES.filter((q) => !TEST_QUERIES.has(q));
const TEST  = ALL_QUERIES.filter((q) =>  TEST_QUERIES.has(q));

const TRAIN_COLOR = '#3fb950';
const TEST_COLOR  = '#58a6ff';
const BLOCK_COLOR = '#f85149';

function QueryPill({
  label,
  side,
  delay,
}: {
  label: string;
  side: 'train' | 'test';
  delay: number;
}) {
  const color = side === 'train' ? TRAIN_COLOR : TEST_COLOR;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.2 }}
      transition={{ duration: 0.3, delay }}
      style={{
        fontFamily: MONO,
        fontSize: 10,
        color,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        borderRadius: 5,
        padding: '3px 7px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 200,
      }}
      title={label}
    >
      {label}
    </motion.div>
  );
}

export default function GroupedSplit() {
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
      {/* header */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#3fb950',
          marginBottom: 4,
        }}
      >
        grouped_split(seed=0) · 18 queries → 14 train / 4 test
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          marginBottom: 18,
        }}
      >
        210 train rows · 60 test rows · no query straddles the boundary
      </div>

      {/* split layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2px 1fr',
          gap: 0,
          alignItems: 'start',
        }}
      >
        {/* TRAIN side */}
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: TRAIN_COLOR,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Train · 14 queries · 210 rows
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {TRAIN.map((q, i) => (
              <QueryPill key={q} label={q} side="train" delay={0.05 * i} />
            ))}
          </div>
        </div>

        {/* fault line */}
        <motion.div
          style={{
            width: 2,
            background: 'linear-gradient(to bottom, transparent, rgba(248,81,73,0.7) 30%, rgba(248,81,73,0.7) 70%, transparent)',
            alignSelf: 'stretch',
            margin: '0 10px',
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          whileInView={{ scaleY: 1, opacity: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        />

        {/* TEST side */}
        <div style={{ paddingLeft: 10 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: TEST_COLOR,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Test · 4 queries · 60 rows
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {TEST.map((q, i) => (
              <QueryPill key={q} label={q} side="test" delay={0.7 + 0.08 * i} />
            ))}
          </div>

          {/* blocked straddle attempt */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.2 }}
            transition={{ delay: 1.3 }}
            style={{ marginTop: 14 }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: BLOCK_COLOR,
                marginBottom: 5,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              blocked: random split would allow this →
            </div>
            <motion.div
              animate={{ x: [0, -6, 6, -4, 4, 0] }}
              transition={{ delay: 1.6, duration: 0.4, ease: 'easeInOut' }}
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: BLOCK_COLOR,
                background: `${BLOCK_COLOR}18`,
                border: `1px solid ${BLOCK_COLOR}66`,
                borderRadius: 5,
                padding: '3px 7px',
                opacity: 0.8,
                textDecoration: 'line-through',
                textDecorationColor: BLOCK_COLOR,
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              noise cancelling headphones
            </motion.div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: '#586069',
                marginTop: 5,
              }}
            >
              Sony XM5 ($162.97) in train,<br />
              Sony XM5 ($248) twin in test<br />
              → inflated score
            </div>
          </motion.div>
        </div>
      </div>

      {/* footer stats */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          marginTop: 18,
          flexWrap: 'wrap',
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          paddingTop: 12,
        }}
      >
        <span>
          <span style={{ color: TRAIN_COLOR }}>■</span> train (210 rows)
        </span>
        <span>
          <span style={{ color: TEST_COLOR }}>■</span> test (60 rows)
        </span>
        <span style={{ color: BLOCK_COLOR }}>■ blocked straddle</span>
        <span>grouped_split keeps each query on one side (test confirmed)</span>
      </div>
    </div>
  );
}
