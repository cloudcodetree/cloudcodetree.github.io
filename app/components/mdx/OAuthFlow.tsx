'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the OAuth 2.0 client-credentials grant as used
 * by the eBay Browse connector. Visual metaphor: a rounded-rectangle "App"
 * node on the left and a hexagonal "Auth Server" node on the right exchange
 * a token packet. The packet travels right (POST /token), transforms into a
 * stamped envelope (access token), bounces back left, then a countdown timer
 * ticks toward expiry — at which point a refresh arrow fires automatically.
 *
 * Distinct shapes: rounded-rect (app node) + hexagon (auth server) — never
 * used elsewhere in the animation library.
 *
 * Static-export-safe: all text is in the DOM; no runtime fetch.
 */

const ORANGE = '#d29922';
const GREEN = '#3fb950';
const BLUE = '#2f81f7';
const PURPLE = '#a371f7';

function Hexagon({ size = 80, color = ACCENT }: { size?: number; color?: string }) {
  const r = size / 2;
  // flat-top hexagon
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} style={{ overflow: 'visible', display: 'block' }}>
      <polygon points={pts} fill={`${color}18`} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export default function OAuthFlow({ accent = ACCENT }: { accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const ctrl = useAnimation();

  useEffect(() => {
    if (isInView) ctrl.start('visible');
  }, [isInView, ctrl]);

  // Packet animation: 0→right→transform→back; repeat
  const packet = {
    hidden: { x: 0, opacity: 0 },
    visible: {
      x: [0, 120, 120, 0],
      opacity: [0, 1, 1, 0],
      scale: [1, 1, 1.15, 1],
      transition: { duration: 2.4, times: [0, 0.4, 0.6, 1], repeat: Infinity, repeatDelay: 1.2 },
    },
  };

  // Refresh arrow: fires after countdown
  const refreshArrow = {
    hidden: { opacity: 0, x: 0 },
    visible: {
      opacity: [0, 0, 0, 1, 1, 0],
      x: [0, 0, 0, 8, 0, 0],
      transition: { duration: 4.8, times: [0, 0.5, 0.65, 0.75, 0.9, 1], repeat: Infinity },
    },
  };

  return (
    <div
      ref={ref}
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '20px 18px',
        margin: '24px 0',
        background: 'rgba(13,17,23,0.4)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 20,
        }}
      >
        OAuth 2.0 client-credentials flow
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          flexWrap: 'wrap',
          rowGap: 24,
        }}
      >
        {/* ── App node (rounded rect) ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={ctrl}
          variants={{ visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            flex: '0 0 auto',
          }}
        >
          <div
            style={{
              width: 96,
              height: 64,
              borderRadius: 12,
              border: `1.5px solid ${BLUE}`,
              background: `${BLUE}14`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontSize: 12,
              color: BLUE,
              fontWeight: 700,
            }}
          >
            Your App
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
            EbaySource
          </div>
        </motion.div>

        {/* ── Channel ─────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', width: 160, height: 80, flex: '0 0 160px' }}>
          {/* outbound label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={ctrl}
            variants={{ visible: { opacity: 1, transition: { delay: 0.5, duration: 0.4 } } }}
            style={{
              position: 'absolute',
              top: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: MONO,
              fontSize: 10,
              color: ORANGE,
            }}
          >
            POST /identity/v1/oauth2/token
          </motion.div>

          {/* token packet travelling right */}
          <motion.div
            animate={ctrl}
            variants={packet}
            style={{
              position: 'absolute',
              top: 26,
              left: 16,
              fontFamily: MONO,
              fontSize: 13,
              color: GREEN,
            }}
          >
            {'{ client_id, secret }'}
          </motion.div>

          {/* return arrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={ctrl}
            variants={{ visible: { opacity: 1, transition: { delay: 0.7, duration: 0.4 } } }}
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: MONO,
              fontSize: 10,
              color: GREEN,
            }}
          >
            ← access_token (7200 s)
          </motion.div>
        </div>

        {/* ── Auth Server node (hexagon) ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={ctrl}
          variants={{ visible: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } } }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            flex: '0 0 auto',
          }}
        >
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <Hexagon size={80} color={ORANGE} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 10,
                color: ORANGE,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              eBay Auth
              <br />
              Server
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
            api.ebay.com
          </div>
        </motion.div>
      </div>

      {/* ── Token cache + countdown ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={ctrl}
        variants={{ visible: { opacity: 1, y: 0, transition: { delay: 0.9, duration: 0.5 } } }}
        style={{
          marginTop: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'stretch',
        }}
      >
        {/* cached token box */}
        <div
          style={{
            flex: '1 1 200px',
            border: `1px solid ${GREEN}40`,
            borderRadius: 10,
            padding: '10px 14px',
            fontFamily: MONO,
            fontSize: 11,
            background: 'rgba(63,185,80,0.05)',
          }}
        >
          <div style={{ color: GREEN, marginBottom: 6, fontWeight: 700 }}>
            ~/.dealfinder/tokens/ebay.json
          </div>
          <div style={{ color: '#8b98a8' }}>
            access_token: <span style={{ color: '#e3e8f0' }}>"v^1.1|REDACTED…"</span>
          </div>
          <div style={{ color: '#8b98a8' }}>
            expires_at: <span style={{ color: ORANGE }}>monotonic + 7200 − 60</span>
          </div>
          <div style={{ color: '#8b98a8', marginTop: 4, fontSize: 10 }}>
            Buffer = 60 s before real expiry → refresh fires proactively
          </div>
        </div>

        {/* auto-refresh trigger */}
        <div
          style={{
            flex: '1 1 180px',
            border: `1px solid ${PURPLE}40`,
            borderRadius: 10,
            padding: '10px 14px',
            fontFamily: MONO,
            fontSize: 11,
            background: `${PURPLE}08`,
          }}
        >
          <div style={{ color: PURPLE, marginBottom: 6, fontWeight: 700 }}>
            _get_token() guard
          </div>
          <div style={{ color: '#8b98a8' }}>
            if <span style={{ color: '#e3e8f0' }}>self._token</span> and{' '}
            <span style={{ color: '#e3e8f0' }}>time.monotonic() &lt; self._expires</span>:
          </div>
          <div style={{ color: '#8b98a8', paddingLeft: 12 }}>
            return <span style={{ color: GREEN }}>cached token</span>   {/* no network */}
          </div>
          <motion.div
            animate={ctrl}
            variants={refreshArrow}
            style={{ color: ORANGE, marginTop: 6, fontSize: 10 }}
          >
            ↻ re-POST /token (auto-refresh on next call)
          </motion.div>
        </div>
      </motion.div>

      <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
        Token is reused across all <span style={{ color: accent }}>search()</span> calls within
        the TTL window — one HTTP round-trip per ~2 hours, not one per query.
      </div>
    </div>
  );
}
