'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * SearchStateMachine — bespoke illustration for Part 27 (Web Front End).
 *
 * Concept: the useSearch hook as a finite state machine. Five states (idle,
 * loading-sse, streaming, done, error/fallback) are arranged left-to-right on a
 * track; animated arrows step through the transitions as the user watches. The
 * "streaming" state expands to show incremental result rows appearing — the key
 * UX idea of SSE. A dashed side-arrow from "error" to "fetch-fallback" shows the
 * fallback path.
 *
 * Metaphor: a conveyor belt of states — distinct from any previous animation
 * shape. Static-export safe (no runtime fetch). Real text in the DOM.
 * Hero-cast anchor: Sony WH-1000XM5 $162.97.
 */

const STATES = [
  { id: 'idle',      label: 'idle',       sub: 'transport: null' },
  { id: 'loading',   label: 'loading',    sub: 'opening SSE' },
  { id: 'streaming', label: 'streaming',  sub: 'results arriving' },
  { id: 'done',      label: 'done',       sub: 'event: done' },
];

// Median-only badgeFor() output (the logic this part ships): deal_pct >= 60 →
// SUSPICIOUS, so BOTH Anker (72.4%) and Bose (71.8%) land on SUSPICIOUS here.
// Part 3's two-signal score is what later separates Anker → DEAL.
const STREAM_ROWS = [
  { text: 'Anker Q20i  $44.99',   badge: 'SUSPICIOUS', badgeColor: '#f59e0b', delay: 1.0 },
  { text: 'Sony XM5  $162.97',    badge: 'FAIR',       badgeColor: '#8b98a8', delay: 1.5 },
  { text: 'Bose QC45  $46.00',    badge: 'SUSPICIOUS', badgeColor: '#f59e0b', delay: 2.0 },
];

const BOX_W = 108;
const BOX_H = 54;
const GAP = 24;
const ARROW_GAP = 8;

export default function SearchStateMachine({ accent = ACCENT }: { accent?: string }) {
  const totalW = STATES.length * BOX_W + (STATES.length - 1) * GAP;

  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '20px 18px',
        margin: '24px 0',
        background: 'rgba(13,17,23,0.4)',
        overflowX: 'auto',
      }}
    >
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
        useSearch — hook state machine
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        query: "noise cancelling headphones" · SSE transport · fallback to /search on error
      </div>

      {/* ── State boxes + arrows ── */}
      <div
        style={{
          position: 'relative',
          width: totalW,
          height: BOX_H + 32,
          margin: '0 auto',
          minWidth: totalW,
        }}
      >
        {STATES.map((s, i) => {
          const x = i * (BOX_W + GAP);
          const isStreaming = s.id === 'streaming';
          const isDone = s.id === 'done';
          return (
            <motion.div
              key={s.id}
              style={{
                position: 'absolute',
                left: x,
                top: 0,
                width: BOX_W,
                height: BOX_H,
                borderRadius: 8,
                border: `1px solid ${isDone ? accent + '60' : 'rgba(148,163,184,0.22)'}`,
                background: isDone
                  ? `${accent}14`
                  : isStreaming
                  ? 'rgba(63,185,80,0.07)'
                  : 'rgba(148,163,184,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: 0.2 + i * 0.3, duration: 0.35 }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDone ? accent : isStreaming ? '#3fb950' : '#cdd7e2',
                }}
              >
                {s.label}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>{s.sub}</span>
            </motion.div>
          );
        })}

        {/* Arrows between states */}
        {STATES.slice(0, -1).map((_, i) => {
          const arrowX = i * (BOX_W + GAP) + BOX_W + ARROW_GAP;
          const arrowW = GAP - ARROW_GAP * 2;
          const arrowY = BOX_H / 2;
          return (
            <motion.svg
              key={i}
              style={{ position: 'absolute', left: arrowX, top: arrowY - 6, overflow: 'visible' }}
              width={arrowW}
              height={12}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: 0.5 + i * 0.3 }}
            >
              <line
                x1={0}
                y1={6}
                x2={arrowW}
                y2={6}
                stroke="rgba(148,163,184,0.4)"
                strokeWidth={1.5}
              />
              <polygon
                points={`${arrowW},6 ${arrowW - 5},3 ${arrowW - 5},9`}
                fill="rgba(148,163,184,0.5)"
              />
            </motion.svg>
          );
        })}

        {/* Error/fallback side-arrow below "loading" state */}
        <motion.div
          style={{
            position: 'absolute',
            left: BOX_W + GAP - 4,
            top: BOX_H + 6,
            fontFamily: MONO,
            fontSize: 10,
            color: '#d29922',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: 1.5 }}
        >
          <span style={{ borderBottom: '1px dashed #d29922', paddingBottom: 1 }}>
            onerror → fallback to GET /search
          </span>
        </motion.div>
      </div>

      {/* ── Streaming rows panel ── */}
      <div
        style={{
          marginTop: 28,
          borderTop: '1px solid rgba(148,163,184,0.12)',
          paddingTop: 14,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: '#3fb950',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          "streaming" state — rows render as each event: results frame arrives
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {STREAM_ROWS.map((row) => (
            <motion.div
              key={row.text}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.16)',
                background: 'rgba(148,163,184,0.04)',
                fontFamily: MONO,
                fontSize: 11,
                color: '#cdd7e2',
              }}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: row.delay, duration: 0.3 }}
            >
              <span>{row.text}</span>
              <span
                style={{
                  fontWeight: 700,
                  color: row.badgeColor,
                  fontSize: 10,
                  letterSpacing: '0.06em',
                }}
              >
                {row.badge}
              </span>
            </motion.div>
          ))}
          <motion.div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: accent,
              paddingLeft: 4,
              marginTop: 2,
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: 2.6 }}
          >
            event: done — count 20 · median $162.97 — deal_pct backfilled, re-sorted cheapest-first
          </motion.div>
        </div>
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          marginTop: 14,
          borderTop: '1px solid rgba(148,163,184,0.1)',
          paddingTop: 10,
        }}
      >
        transport: "sse" while streaming · switches to "fetch" if EventSource errors before done
      </div>
    </div>
  );
}
