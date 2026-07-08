'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * ProxyTunnel — bespoke illustration for Part 27 (Web Front End).
 *
 * Concept: the Vite dev proxy as a tunnel. Shows three lanes side by side:
 *   Left lane  — Browser (port 5173) issuing requests to same-origin paths
 *   Middle     — The Vite proxy rewriting + forwarding
 *   Right lane — FastAPI backend (port 8000) receiving clean requests
 *
 * Metaphor: a railway tunnel — packets travel through, CORS never fires.
 * Distinct shape from all existing components.
 *
 * Static-export safe (no runtime fetch). Real text in the DOM.
 * In production, VITE_API_BASE replaces the proxy — the animation notes this.
 */

const ROUTES = [
  { path: '/search/stream?q=…', note: 'SSE — EventSource, text/event-stream', color: '#3fb950' },
  { path: '/search?q=…',        note: 'fallback JSON fetch',                    color: '#58a6ff' },
  { path: '/me',                 note: 'bearer-gated identity (Part 28)',        color: '#d29922' },
  { path: '/healthz',            note: 'readiness probe',                        color: '#8b98a8' },
];

export default function ProxyTunnel({ accent = ACCENT }: { accent?: string }) {
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
        Vite dev proxy — same-origin requests, CORS-free SSE
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        vite.config.ts proxy rewrites browser → FastAPI · production uses VITE_API_BASE instead
      </div>

      {/* ── Three-column layout ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 1fr',
          gap: 0,
          alignItems: 'stretch',
        }}
      >
        {/* Browser column */}
        <motion.div
          style={{
            border: '1px solid rgba(148,163,184,0.22)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            padding: '12px 10px',
            background: 'rgba(148,163,184,0.04)',
          }}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: '#8b98a8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            Browser :5173
          </div>
          {ROUTES.map((r, i) => (
            <motion.div
              key={r.path}
              style={{ marginBottom: 10 }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: 0.2 + i * 0.2 }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: r.color,
                  fontWeight: 600,
                  marginBottom: 1,
                }}
              >
                {r.path}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>{r.note}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tunnel column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid rgba(148,163,184,0.22)',
            borderBottom: '1px solid rgba(148,163,184,0.22)',
            background: 'rgba(47,129,247,0.06)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Tunnel arcs at top and bottom */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 14,
              background: 'rgba(47,129,247,0.12)',
              borderBottom: '1px solid rgba(47,129,247,0.3)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 14,
              background: 'rgba(47,129,247,0.12)',
              borderTop: '1px solid rgba(47,129,247,0.3)',
            }}
          />

          {/* Animated packets through the tunnel */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: ROUTES[i % ROUTES.length].color,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
              animate={{ y: ['-30px', '30px'] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.35,
              }}
            />
          ))}

          <span
            style={{
              fontFamily: MONO,
              fontSize: 9,
              color: '#58a6ff',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              writingMode: 'vertical-rl',
              opacity: 0.7,
            }}
          >
            proxy
          </span>
        </div>

        {/* FastAPI column */}
        <motion.div
          style={{
            border: '1px solid rgba(148,163,184,0.22)',
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            padding: '12px 10px',
            background: 'rgba(148,163,184,0.04)',
          }}
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: '#8b98a8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            FastAPI :8000
          </div>
          {ROUTES.map((r, i) => (
            <motion.div
              key={r.path}
              style={{ marginBottom: 10 }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: 0.4 + i * 0.2 }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: r.color,
                  fontWeight: 600,
                  marginBottom: 1,
                }}
              >
                {r.path}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
                {r.path.startsWith('/search/stream')
                  ? 'StreamingResponse text/event-stream'
                  : r.path.startsWith('/search')
                  ? '{ query, count, median_price, results }'
                  : r.path === '/me'
                  ? '{ id, email, role } — requires Bearer'
                  : '{ status: "ok" }'}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Production note */}
      <motion.div
        style={{
          marginTop: 14,
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px dashed rgba(148,163,184,0.22)',
          fontFamily: MONO,
          fontSize: 10,
          color: '#8b98a8',
        }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.3 }}
        transition={{ delay: 1.2 }}
      >
        Production: set <span style={{ color: accent }}>VITE_API_BASE=https://api.example.com</span> — no proxy,
        SPA calls the real origin. Ingress annotations{' '}
        <span style={{ color: '#cdd7e2' }}>proxy-buffering: off</span> +{' '}
        <span style={{ color: '#cdd7e2' }}>proxy-read-timeout: 3600</span> keep SSE alive through the
        load balancer (Part 25).
      </motion.div>
    </div>
  );
}
