'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for SlidingWindowRateLimiter (Part 31, compliance.py).
 *
 * Metaphor: a timeline of request tokens flowing left to right. As time
 * advances, old tokens slide off the left edge (evicted) and the window
 * shrinks. The animation shows the exact sequence from the ground-truth
 * execution: limit=3, window=10s, five calls at t=0,1,2,3,4.
 *
 *   decisions: [True, True, True, False, False]
 *
 * Each token is a circle coloured green (allowed) or red (blocked). A
 * sliding bracket labelled "window" spans the live tokens. This is NOT the
 * Shopify burst-vs-guarded pattern — it is a timeline ruler, distinct shape.
 *
 * Static-export-safe: all text in DOM, Framer Motion only.
 */

const CALLS: { t: number; allowed: boolean }[] = [
  { t: 0, allowed: true },
  { t: 1, allowed: true },
  { t: 2, allowed: true },
  { t: 3, allowed: false },
  { t: 4, allowed: false },
];

const WINDOW_S = 10;
const LIMIT = 3;

// Layout constants (all in px)
const TOKEN_R = 18; // radius
const GAP = 12; // gap between tokens
const TOKENS_PER_ROW = 5;
const TOKEN_STEP = TOKEN_R * 2 + GAP;

function Token({ call, index }: { call: (typeof CALLS)[number]; index: number }) {
  const col = call.allowed ? '#3fb950' : '#f85149';
  const label = call.allowed ? 'allow' : 'block';
  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: TOKEN_R * 2,
        flexShrink: 0,
      }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.4 }}
      transition={{ delay: 0.1 + index * 0.18, type: 'spring', stiffness: 220, damping: 20 }}
    >
      {/* circle */}
      <motion.div
        style={{
          width: TOKEN_R * 2,
          height: TOKEN_R * 2,
          borderRadius: '50%',
          border: `2px solid ${col}66`,
          background: `${col}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        initial={{ borderColor: 'rgba(148,163,184,0.25)', background: 'rgba(148,163,184,0.08)' }}
        whileInView={{ borderColor: `${col}66`, background: `${col}20` }}
        viewport={{ amount: 0.4 }}
        transition={{ delay: 0.25 + index * 0.18, duration: 0.3 }}
      >
        <motion.span
          style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: col }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.4 }}
          transition={{ delay: 0.38 + index * 0.18 }}
        >
          {call.allowed ? '✓' : '✕'}
        </motion.span>
      </motion.div>

      {/* t label */}
      <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>t={call.t}</span>

      {/* verdict */}
      <span style={{ fontFamily: MONO, fontSize: 9, color: col, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </motion.div>
  );
}

export default function SlidingWindowClock({ accent = ACCENT }: { accent?: string }) {
  const allowed = CALLS.filter((c) => c.allowed).length; // 3
  const blocked = CALLS.filter((c) => !c.allowed).length; // 2

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
          color: accent,
          marginBottom: 4,
        }}
      >
        SlidingWindowRateLimiter — limit={LIMIT}, window={WINDOW_S}s
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        five calls at t=0…4 · decisions: [T, T, T, F, F]
      </div>

      {/* token row */}
      <div
        style={{
          display: 'flex',
          gap: GAP,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {CALLS.map((call, i) => (
          <Token key={call.t} call={call} index={i} />
        ))}
      </div>

      {/* window bracket (illustrative) */}
      <motion.div
        style={{
          marginTop: 16,
          borderTop: `2px solid ${accent}60`,
          borderLeft: `2px solid ${accent}60`,
          borderRight: `2px solid ${accent}60`,
          borderRadius: '4px 4px 0 0',
          width: TOKEN_STEP * TOKENS_PER_ROW - GAP,
          maxWidth: '100%',
          height: 10,
          position: 'relative',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.4 }}
        transition={{ delay: 1.1 }}
      >
        <span
          style={{
            position: 'absolute',
            top: -22,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: MONO,
            fontSize: 10,
            color: accent,
            whiteSpace: 'nowrap',
          }}
        >
          ← sliding window ({WINDOW_S}s) →
        </span>
      </motion.div>

      {/* summary row */}
      <div
        style={{
          marginTop: 18,
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <span>
          allowed:{' '}
          <span style={{ color: '#3fb950', fontWeight: 700 }}>{allowed}</span>
        </span>
        <span>
          blocked:{' '}
          <span style={{ color: '#f85149', fontWeight: 700 }}>{blocked}</span>
        </span>
        <span>
          window resets by{' '}
          <span style={{ color: accent }}>t={WINDOW_S + CALLS[0].t}</span>
        </span>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 10 }}>
        Old events slide off the left as time advances — no fixed bucket reset, no
        thundering herd at the boundary.
      </div>
    </div>
  );
}
