'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for "rate-limit guard" — the Shopify public-feed
 * scraping loop in ShopifySource.search(). Each store fetch is a "token"
 * from a conceptual bucket. The animation shows two contrasting strategies:
 *
 *   - Burst (no guard): all five store requests fire simultaneously →
 *     most return 429 / connection-refused.
 *   - Guarded (1 req / store with timeout=15): one circle at a time, each
 *     resolves to a price row before the next begins.
 *
 * Visual metaphor: two horizontal lanes of request circles. Burst lane fires
 * at once (most go red). Guarded lane fires sequentially, each going green.
 * The two-lane contrast IS the lesson: write the guarded version.
 *
 * Store names are from ShopifySource.DEFAULT_STORES (companion code).
 * Static-export-safe: all text in DOM, no runtime fetch.
 */

const STORES = ['peakdesign.com', 'spigen.com', 'allbirds.com', 'hexclad.com', 'kith.com'];

type RequestState = 'ok' | 'fail';

// In "burst" mode most stores throttle or block us
const BURST_RESULTS: RequestState[] = ['fail', 'fail', 'ok', 'fail', 'ok'];
// In "guarded" mode (sequential, timeout=15) all succeed
const GUARDED_RESULTS: RequestState[] = ['ok', 'ok', 'ok', 'ok', 'ok'];

function RequestDot({
  store,
  result,
  delay,
  burstMode,
}: {
  store: string;
  result: RequestState;
  delay: number;
  burstMode: boolean;
}) {
  const ok = result === 'ok';
  const finalColor = ok ? '#94bce3' : '#f85149';
  const note = ok ? '200 OK' : burstMode ? '429 throttled' : '—';

  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
      initial={{ opacity: 0, y: burstMode ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.4 }}
      transition={burstMode ? { duration: 0.05 } : { delay, type: 'spring', stiffness: 240, damping: 22 }}
    >
      {/* the request dot */}
      <motion.div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `2px solid ${finalColor}66`,
          background: `${finalColor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        initial={{ background: 'rgba(148,163,184,0.1)', borderColor: 'rgba(148,163,184,0.25)' }}
        whileInView={{
          background: `${finalColor}18`,
          borderColor: `${finalColor}66`,
        }}
        viewport={{ amount: 0.4 }}
        transition={{ delay: burstMode ? 0.3 : delay + 0.35, duration: 0.3 }}
      >
        <motion.span
          style={{ fontFamily: MONO, fontSize: 14, color: finalColor, fontWeight: 700 }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.4 }}
          transition={{ delay: burstMode ? 0.4 : delay + 0.5, duration: 0.2 }}
        >
          {ok ? '✓' : '✕'}
        </motion.span>
      </motion.div>

      {/* store label */}
      <span
        style={{
          fontFamily: MONO,
          fontSize: 8,
          color: '#8b98a8',
          textAlign: 'center',
          maxWidth: 56,
          lineHeight: 1.3,
        }}
      >
        {store.replace('.com', '')}
      </span>

      {/* result note */}
      <span style={{ fontFamily: MONO, fontSize: 8, color: finalColor, whiteSpace: 'nowrap' }}>
        {note}
      </span>
    </motion.div>
  );
}

function Lane({
  label,
  note,
  stores,
  results,
  burstMode,
  accent,
}: {
  label: string;
  note: string;
  stores: string[];
  results: RequestState[];
  burstMode: boolean;
  accent: string;
}) {
  const labelColor = burstMode ? '#f85149' : '#94bce3';
  return (
    <div style={{ flex: '1 1 220px', minWidth: 200 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: labelColor, fontWeight: 700, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 12 }}>
        {note}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {stores.map((store, i) => (
          <RequestDot
            key={store}
            store={store}
            result={results[i]}
            delay={i * 0.28}
            burstMode={burstMode}
          />
        ))}
      </div>
    </div>
  );
}

export default function RateLimitGuard({ accent = ACCENT }: { accent?: string }) {
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
        ShopifySource — burst vs. guarded fetch
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        five stores · sequential timeout=15 loop keeps you off the blocklist
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Lane
          label="burst — no rate guard"
          note="all requests fire at once"
          stores={STORES}
          results={BURST_RESULTS}
          burstMode
          accent={accent}
        />

        {/* divider */}
        <div
          style={{
            width: 1,
            background: 'rgba(148,163,184,0.12)',
            alignSelf: 'stretch',
            flexShrink: 0,
          }}
        />

        <Lane
          label="guarded — sequential"
          note="one store, await, next — timeout=15s"
          stores={STORES}
          results={GUARDED_RESULTS}
          burstMode={false}
          accent={accent}
        />
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 18 }}>
        <span style={{ color: accent }}>ShopifySource</span> iterates stores in a{' '}
        <span style={{ color: accent }}>try/except</span> loop with{' '}
        <span style={{ color: accent }}>timeout=15</span>; a non-200 status{' '}
        <span style={{ color: '#f85149' }}>continues</span> to the next store rather than raising.
        No sleep between stores — the round-trip latency is the natural throttle.
      </div>
    </div>
  );
}
