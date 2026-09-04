'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of Server-Sent Events (SSE) incremental delivery.
 *
 * Concept: a horizontal pipe from Server to Browser, split into labeled chunks
 * that light up in sequence. Each chunk represents one source's batch arriving
 * from the aggregator. A "waiting" reference bar shows what a naive
 * request/response pattern looks like — everything blocked until all sources
 * finish. The contrast makes the latency-perception benefit of SSE legible.
 *
 * Data is entirely static (no runtime fetch). Real text in the DOM for
 * accessibility and static-export safety. Framer Motion animates segment
 * opacity and card-stack height.
 *
 * Hero-cast anchor: "noise cancelling headphones", snapshot median $162.97.
 */

const CHUNKS = [
  { label: 'google_shopping', count: 12, ms: 340, color: '#94bce3' },
  { label: 'bestbuy_scraper', count: 8,  ms: 890, color: '#58a6ff' },
  { label: 'done',            count: 20, ms: 920, color: '#8b98a8', done: true },
];

const CARD_LABELS = [
  { text: 'Anker Q20i  $44.99', badge: 'DEAL',       badgeColor: '#94bce3' },
  { text: 'Sony XM5  $162.97',  badge: 'FAIR',       badgeColor: '#58a6ff' },
  { text: 'Bose QC45  $46.00',  badge: 'SUSPICIOUS', badgeColor: '#d29922' },
  { text: '+ 14 more…',         badge: '',            badgeColor: 'transparent' },
];

export default function SSEStream({ accent = ACCENT }: { accent?: string }) {
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
          marginBottom: 4,
        }}
      >
        SSE: results arrive as each source responds
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        query: "noise cancelling headphones" · median $162.97
      </div>

      {/* ── SSE pipe row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {/* Server label */}
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: '#8b98a8',
            border: '1px solid rgba(148,163,184,0.22)',
            borderRadius: 6,
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          Server
        </div>

        {/* Pipe segments */}
        {CHUNKS.map((chunk, i) => (
          <motion.div
            key={chunk.label}
            style={{
              flex: chunk.done ? '0 0 auto' : '1 1 0',
              minWidth: chunk.done ? 'auto' : 80,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(148,163,184,0.06)',
              borderTop: `1px solid rgba(148,163,184,0.18)`,
              borderBottom: `1px solid rgba(148,163,184,0.18)`,
              borderRight: i < CHUNKS.length - 1 ? `1px solid rgba(148,163,184,0.18)` : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
            initial={{ opacity: 0.15 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.3 + i * 0.55, duration: 0.4 }}
          >
            {/* colour fill that lights up */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                background: `${chunk.color}18`,
                borderTop: `2px solid ${chunk.color}60`,
                borderBottom: `2px solid ${chunk.color}60`,
              }}
              initial={{ scaleX: 0, transformOrigin: 'left' }}
              whileInView={{ scaleX: 1 }}
              viewport={{ amount: 0.4 }}
              transition={{ delay: 0.3 + i * 0.55, duration: 0.35 }}
            />
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                color: chunk.done ? '#8b98a8' : '#cdd7e2',
                position: 'relative',
                textAlign: 'center',
                padding: '0 6px',
              }}
            >
              {chunk.done
                ? `done · ${CHUNKS[0].count + CHUNKS[1].count} total · ${CHUNKS[0].count + CHUNKS[1].count - 3} deduped`
                : `${chunk.label}\n${chunk.count} items · ${chunk.ms} ms`}
            </span>
          </motion.div>
        ))}

        {/* Browser label */}
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: '#8b98a8',
            border: '1px solid rgba(148,163,184,0.22)',
            borderRadius: 6,
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            flex: '0 0 auto',
          }}
        >
          Browser
        </div>
      </div>

      {/* ── Two-column comparison ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* SSE column */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: accent,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            with SSE — cards appear incrementally
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {CARD_LABELS.map((c, i) => (
              <motion.div
                key={c.text}
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  padding: '5px 8px',
                  borderRadius: 6,
                  color: '#cdd7e2',
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(148,163,184,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 6,
                }}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.4 }}
                transition={{ delay: 0.3 + i * 0.55 }}
              >
                <span>{c.text}</span>
                {c.badge && (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      color: c.badgeColor,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {c.badge}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
          <div
            style={{ fontFamily: MONO, fontSize: 10, color: '#94bce3', marginTop: 6 }}
          >
            first card at ~340 ms
          </div>
        </div>

        {/* Naive column */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: '#8b98a8',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            naive request/response — blocked until all done
          </div>
          <motion.div
            style={{
              height: 116,
              borderRadius: 6,
              border: '1px solid rgba(148,163,184,0.14)',
              background: 'rgba(148,163,184,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            initial={{ opacity: 0.2 }}
            whileInView={{ opacity: 0.5 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.2 }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: '#8b98a8',
                textAlign: 'center',
              }}
            >
              waiting…
              <br />
              <span style={{ fontSize: 10 }}>nothing visible until ~920 ms</span>
            </span>
          </motion.div>
          <div
            style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 6 }}
          >
            all cards at ~920 ms
          </div>
        </div>
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          marginTop: 16,
          borderTop: '1px solid rgba(148,163,184,0.1)',
          paddingTop: 12,
        }}
      >
        SSE halves perceived latency — the search feels instant even though the
        total round-trip is unchanged.
      </div>
    </div>
  );
}
