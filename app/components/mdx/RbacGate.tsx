'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * RbacGate — bespoke illustration of how require_role() layers on top of
 * require_user() to build a role gate.
 *
 * Visual metaphor: two callers (a "free" token diamond and a "pro" token
 * diamond) approach a turnstile gate in the center. The free token bounces off
 * (red flash, 403); the pro token passes through (green path, 200). A route
 * box on the right shows the protected endpoint.
 *
 * Distinct shapes: rotated-square (diamond) for callers + a turnstile cross
 * for the gate — not used elsewhere in the library.
 *
 * Static-export-safe: all text in the DOM; Framer Motion only.
 */

const GREEN = '#94bce3';
const RED = '#f85149';
const BLUE = '#94bce3';
const ORANGE = '#d29922';
const GREY = '#8b98a8';

function Diamond({
  color,
  label,
  sublabel,
  size = 56,
}: {
  color: string;
  label: string;
  sublabel: string;
  size?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          transform: 'rotate(45deg)',
          border: `1.5px solid ${color}`,
          background: `${color}18`,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: 'rotate(-45deg)',
            fontFamily: MONO,
            fontSize: 9,
            color,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 9, color: GREY }}>{sublabel}</div>
    </div>
  );
}

/** A simple turnstile cross drawn with two rectangles. */
function Turnstile({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: 48, height: 48 }}>
      {/* vertical bar */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 4,
          bottom: 4,
          width: 3,
          marginLeft: -1,
          background: color,
          borderRadius: 2,
        }}
      />
      {/* horizontal bar */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 4,
          right: 4,
          height: 3,
          marginTop: -1,
          background: color,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

export default function RbacGate({ accent = ACCENT }: { accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const ctrl = useAnimation();

  useEffect(() => {
    if (isInView) ctrl.start('visible');
  }, [isInView, ctrl]);

  /* free caller: approaches gate then bounces back */
  const freeMove = {
    hidden: { x: 0, opacity: 0 },
    visible: {
      x: [0, 50, 20],
      opacity: [0, 1, 1],
      transition: { duration: 1.2, times: [0, 0.55, 1], delay: 0.5 },
    },
  };

  /* red flash on gate when free caller hits */
  const gateFlash = {
    hidden: { opacity: 0 },
    visible: {
      opacity: [0, 0, 1, 0],
      transition: { duration: 1.2, times: [0, 0.5, 0.7, 1], delay: 0.5 },
    },
  };

  /* pro caller: passes through to route */
  const proMove = {
    hidden: { x: 0, opacity: 0 },
    visible: {
      x: [0, 50, 100, 140],
      opacity: [0, 1, 1, 1],
      transition: { duration: 1.6, times: [0, 0.3, 0.7, 1], delay: 1.6 },
    },
  };

  /* route box lights green after pro passes */
  const routeLight = {
    hidden: { opacity: 0.3 },
    visible: { opacity: 1, transition: { delay: 3.0, duration: 0.4 } },
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
        require_role("pro") — RBAC gate
      </div>

      {/* ── top row: callers → gate → route ─────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          overflowX: 'auto',
          paddingBottom: 8,
        }}
      >
        {/* callers column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '0 0 auto' }}>
          {/* free caller */}
          <motion.div
            initial="hidden"
            animate={ctrl}
            variants={freeMove}
            style={{ position: 'relative' }}
          >
            <Diamond color={ORANGE} label="free" sublabel='role="free"' />
          </motion.div>

          {/* pro caller */}
          <motion.div
            initial="hidden"
            animate={ctrl}
            variants={proMove}
          >
            <Diamond color={BLUE} label="pro" sublabel='role="pro"' />
          </motion.div>
        </div>

        {/* spacer + gate area */}
        <div
          style={{
            flex: '0 0 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            position: 'relative',
          }}
        >
          {/* gate flash overlay */}
          <motion.div
            initial="hidden"
            animate={ctrl}
            variants={gateFlash}
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: 8,
              background: `${RED}30`,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
          <Turnstile color={accent} />
          <div style={{ fontFamily: MONO, fontSize: 9, color: GREY, textAlign: 'center' }}>
            require_role
            <br />
            ("pro")
          </div>
        </div>

        {/* route box */}
        <motion.div
          initial="hidden"
          animate={ctrl}
          variants={routeLight}
          style={{
            flex: '0 0 auto',
            border: `1.5px solid ${GREEN}`,
            borderRadius: 10,
            background: `${GREEN}14`,
            padding: '10px 14px',
            fontFamily: MONO,
            fontSize: 10,
            color: GREEN,
            minWidth: 110,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 3 }}>GET /pro/export</div>
          <div style={{ color: GREY }}>
            user: <span style={{ color: BLUE }}>User(role="pro")</span>
          </div>
          <div style={{ color: GREEN, marginTop: 4 }}>200 OK</div>
        </motion.div>
      </div>

      {/* ── outcome legend ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={ctrl}
        variants={{ visible: { opacity: 1, y: 0, transition: { delay: 2.6, duration: 0.4 } } }}
        style={{
          marginTop: 16,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: '1 1 auto',
            border: `1px solid ${RED}40`,
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: MONO,
            fontSize: 10,
            background: `${RED}08`,
          }}
        >
          <span style={{ color: ORANGE }}>free token → gate → </span>
          <span style={{ color: RED }}>403 requires role &apos;pro&apos;</span>
        </div>
        <div
          style={{
            flex: '1 1 auto',
            border: `1px solid ${GREEN}40`,
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: MONO,
            fontSize: 10,
            background: `${GREEN}08`,
          }}
        >
          <span style={{ color: BLUE }}>pro token → gate → </span>
          <span style={{ color: GREEN }}>200 User passed through</span>
        </div>
      </motion.div>

      {/* ── code note ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ctrl}
        variants={{ visible: { opacity: 1, transition: { delay: 2.8, duration: 0.4 } } }}
        style={{
          marginTop: 12,
          fontFamily: MONO,
          fontSize: 10,
          color: GREY,
          lineHeight: 1.6,
        }}
      >
        <span style={{ color: accent }}>require_role</span> calls{' '}
        <span style={{ color: accent }}>require_user</span> first — the JWT is
        always verified before role is checked. Public routes (
        <span style={{ color: '#e3e8f0' }}>GET /search/stream</span>) carry no
        dependency at all.
      </motion.div>
    </div>
  );
}
