'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * JwtDecodeRing — bespoke illustration of how a Supabase JWT is verified
 * locally (no network on the hot path).
 *
 * Visual metaphor: a JWT token (three-segment pill — header · payload · sig)
 * arrives on the left. A circular "verify ring" in the center lights each check
 * sequentially — signature, expiry, audience, sub. A green "User" card emerges
 * on the right when all checks pass; a red "401" card when any fail.
 *
 * Distinct shapes: pill segments + glowing ring — not used elsewhere.
 *
 * Static-export-safe: all text in the DOM; Framer Motion only.
 */

const GREEN = '#3fb950';
const RED = '#f85149';
const ORANGE = '#d29922';
const BLUE = '#2f81f7';
const PURPLE = '#a371f7';
const GREY = '#8b98a8';

const CHECKS = [
  { label: 'signature', note: 'HS256 + secret', color: BLUE },
  { label: 'expiry', note: 'exp > now', color: GREEN },
  { label: 'audience', note: '"authenticated"', color: ORANGE },
  { label: 'sub', note: 'user UUID', color: PURPLE },
];

function Ring({
  accent,
  ctrl,
}: {
  accent: string;
  ctrl: ReturnType<typeof useAnimation>;
}) {
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      {/* outer circle */}
      <svg
        width={110}
        height={110}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        <circle
          cx={55}
          cy={55}
          r={48}
          fill="none"
          stroke={`${accent}26`}
          strokeWidth={2}
        />
      </svg>

      {/* check dots at cardinal positions */}
      {CHECKS.map((c, i) => {
        const angle = (Math.PI / 2) * i - Math.PI / 2; // N, E, S, W
        const cx = 55 + 38 * Math.cos(angle);
        const cy = 55 + 38 * Math.sin(angle);
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, scale: 0 }}
            animate={ctrl}
            variants={{
              visible: {
                opacity: 1,
                scale: 1,
                transition: { delay: 0.3 + i * 0.35, duration: 0.3, type: 'spring' },
              },
            }}
            style={{
              position: 'absolute',
              left: cx - 14,
              top: cy - 14,
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `1.5px solid ${c.color}`,
              background: `${c.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontSize: 8,
              color: c.color,
              fontWeight: 700,
              lineHeight: 1.1,
              textAlign: 'center',
            }}
          >
            {c.label === 'signature' ? 'sig' : c.label}
          </motion.div>
        );
      })}

      {/* center label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ctrl}
        variants={{ visible: { opacity: 1, transition: { delay: 0.1, duration: 0.4 } } }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 10,
          color: accent,
          fontWeight: 700,
          lineHeight: 1.3,
          textAlign: 'center',
        }}
      >
        verify
        <br />
        ring
      </motion.div>
    </div>
  );
}

export default function JwtDecodeRing({ accent = ACCENT }: { accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const ctrl = useAnimation();

  useEffect(() => {
    if (isInView) ctrl.start('visible');
  }, [isInView, ctrl]);

  /* Token pill animation: slides in from left, then fades as user card appears */
  const pillAnim = {
    hidden: { x: -24, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  /* User card: emerges after all checks complete */
  const userCard = {
    hidden: { x: 24, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { delay: 1.8, duration: 0.5, ease: 'easeOut' as const } },
  };

  const segments = [
    { label: 'header', bg: `${BLUE}18`, border: BLUE, text: BLUE },
    { label: 'payload', bg: `${GREEN}18`, border: GREEN, text: GREEN },
    { label: 'sig', bg: `${ORANGE}18`, border: ORANGE, text: ORANGE },
  ];

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
        JWT decode — no network on the hot path
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
          rowGap: 20,
        }}
      >
        {/* ── JWT pill ─────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate={ctrl}
          variants={pillAnim}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <div style={{ display: 'flex', gap: 2 }}>
            {segments.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: `1.5px solid ${s.border}`,
                  background: s.bg,
                  fontFamily: MONO,
                  fontSize: 10,
                  color: s.text,
                  fontWeight: 700,
                }}
              >
                {s.label}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: GREY }}>
            Bearer token (HS256)
          </div>
        </motion.div>

        {/* arrow → */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={ctrl}
          variants={{ visible: { opacity: 1, transition: { delay: 0.5, duration: 0.3 } } }}
          style={{ fontFamily: MONO, fontSize: 18, color: GREY, flexShrink: 0 }}
          aria-hidden="true"
        >
          →
        </motion.div>

        {/* ── Verify ring ───────────────────────────────────────── */}
        <Ring accent={accent} ctrl={ctrl} />

        {/* arrow → */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={ctrl}
          variants={{ visible: { opacity: 1, transition: { delay: 1.6, duration: 0.3 } } }}
          style={{ fontFamily: MONO, fontSize: 18, color: GREY, flexShrink: 0 }}
          aria-hidden="true"
        >
          →
        </motion.div>

        {/* ── User card ─────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate={ctrl}
          variants={userCard}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <div
            style={{
              border: `1.5px solid ${GREEN}`,
              borderRadius: 10,
              background: `${GREEN}14`,
              padding: '10px 16px',
              fontFamily: MONO,
              fontSize: 11,
              color: GREEN,
              minWidth: 120,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, color: GREEN }}>User</div>
            <div style={{ color: GREY }}>
              id: <span style={{ color: '#e3e8f0' }}>"user-uuid"</span>
            </div>
            <div style={{ color: GREY }}>
              email: <span style={{ color: '#e3e8f0' }}>"a@b.com"</span>
            </div>
            <div style={{ color: GREY }}>
              role: <span style={{ color: BLUE }}>"free"</span>
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: GREEN }}>200 OK</div>
        </motion.div>
      </div>

      {/* ── failure path note ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={ctrl}
        variants={{ visible: { opacity: 1, y: 0, transition: { delay: 2.0, duration: 0.4 } } }}
        style={{
          marginTop: 18,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'expired', code: '401 token expired', col: RED },
          { label: 'tampered / wrong secret', code: '401 invalid token', col: RED },
          { label: 'no bearer', code: '401 Not authenticated', col: ORANGE },
          { label: 'wrong role', code: '403 requires role "pro"', col: ORANGE },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              flex: '1 1 auto',
              border: `1px solid ${f.col}40`,
              borderRadius: 8,
              padding: '7px 10px',
              fontFamily: MONO,
              fontSize: 10,
              background: `${f.col}08`,
            }}
          >
            <span style={{ color: GREY }}>{f.label} → </span>
            <span style={{ color: f.col }}>{f.code}</span>
          </div>
        ))}
      </motion.div>

      <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 10, color: GREY }}>
        All verification happens locally against{' '}
        <span style={{ color: accent }}>SUPABASE_JWT_SECRET</span> — no Supabase API
        call on the hot path.
      </div>
    </div>
  );
}
