'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the Stripe Checkout Session lifecycle for Part 30.
 *
 * Visual metaphor: three distinct shapes arranged left-to-right as a pipeline.
 *   1. Diamond (client app) — unique to this component
 *   2. Trapezoid (Stripe Checkout hosted page) — unique to this component
 *   3. Pentagon (webhook endpoint) — unique to this component
 *
 * A token-like payload travels: App → Stripe (POST /checkout/session.create),
 * the user is redirected to the hosted page, payment completes, then Stripe
 * fires a webhook back to the app's endpoint. A glowing "Entitlement" badge
 * lights up at the end to show the plan was activated.
 *
 * Static-export-safe: all text is real DOM text. No runtime fetch.
 * Framer Motion animates the payload packet and badge reveal.
 */

const GREEN = '#3fb950';
const PURPLE = '#a371f7';
const ORANGE = '#d29922';
const BLUE = '#2f81f7';

function Diamond({ size = 72, color = ACCENT }: { size?: number; color?: string }) {
  const half = size / 2;
  return (
    <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      <polygon
        points={`${half},0 ${size},${half} ${half},${size} 0,${half}`}
        fill={`${color}18`}
        stroke={color}
        strokeWidth={1.5}
      />
    </svg>
  );
}

function Trapezoid({ width = 96, height = 56, color = ACCENT }: { width?: number; height?: number; color?: string }) {
  const inset = 14;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polygon
        points={`${inset},0 ${width - inset},0 ${width},${height} 0,${height}`}
        fill={`${color}18`}
        stroke={color}
        strokeWidth={1.5}
      />
    </svg>
  );
}

function Pentagon({ size = 68, color = ACCENT }: { size?: number; color?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (2 * Math.PI * i) / 5 - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      <polygon points={pts} fill={`${color}18`} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

const STEPS = [
  { phase: '1', label: 'POST /checkout', sublabel: 'create session', color: BLUE },
  { phase: '2', label: 'redirect → Stripe', sublabel: 'hosted payment page', color: PURPLE },
  { phase: '3', label: 'webhook fired', sublabel: 'checkout.session.completed', color: ORANGE },
  { phase: '4', label: 'Entitlement granted', sublabel: 'user_id + plan → pro', color: GREEN },
];

export default function CheckoutFlow({ accent = ACCENT }: { accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.35 });
  const ctrl = useAnimation();

  useEffect(() => {
    if (isInView) ctrl.start('visible');
  }, [isInView, ctrl]);

  const packetVariants = {
    hidden: { x: 0, opacity: 0 },
    visible: {
      x: [0, 80, 80, 160, 160, 240],
      opacity: [0, 1, 1, 1, 1, 0],
      transition: {
        duration: 3.2,
        times: [0, 0.2, 0.35, 0.55, 0.7, 1],
        repeat: Infinity,
        repeatDelay: 1.6,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.7 },
    visible: {
      opacity: [0, 0, 0, 1],
      scale: [0.7, 0.7, 0.7, 1],
      transition: {
        duration: 3.2,
        times: [0, 0.6, 0.75, 1],
        repeat: Infinity,
        repeatDelay: 1.6,
      },
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
          marginBottom: 4,
        }}
      >
        Stripe Checkout session lifecycle
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        client → Stripe hosted page → webhook → entitlement
      </div>

      {/* Node row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Diamond: Your App */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={ctrl}
          variants={{ visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        >
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <Diamond size={72} color={BLUE} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 9,
                color: BLUE,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              Your
              <br />
              App
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
            /billing/upgrade
          </div>
        </motion.div>

        {/* Animated packet */}
        <div style={{ flex: '0 0 260px', position: 'relative', height: 36 }}>
          <motion.div
            animate={ctrl}
            variants={packetVariants}
            style={{
              position: 'absolute',
              top: 8,
              left: 0,
              fontFamily: MONO,
              fontSize: 11,
              color: PURPLE,
              whiteSpace: 'nowrap',
            }}
          >
            {'{ mode:"subscription", price_id, user_id }'}
          </motion.div>
        </div>

        {/* Trapezoid: Stripe Checkout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={ctrl}
          variants={{ visible: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.2 } } }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        >
          <div style={{ position: 'relative', width: 96, height: 56 }}>
            <Trapezoid width={96} height={56} color={PURPLE} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 9,
                color: PURPLE,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              Stripe
              <br />
              Checkout
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
            checkout.stripe.com
          </div>
        </motion.div>

        {/* Pentagon: Webhook endpoint */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={ctrl}
          variants={{ visible: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.4 } } }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        >
          <div style={{ position: 'relative', width: 68, height: 68 }}>
            <Pentagon size={68} color={ORANGE} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 9,
                color: ORANGE,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              /webhook
              <br />
              endpoint
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
            HMAC verified
          </div>
        </motion.div>
      </div>

      {/* Phase steps */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {STEPS.map((s, i) => (
          <motion.div
            key={s.phase}
            initial={{ opacity: 0, y: 6 }}
            animate={ctrl}
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                transition: { delay: 0.3 + i * 0.15, duration: 0.35 },
              },
            }}
            style={{
              flex: '1 1 140px',
              border: `1px solid ${s.color}35`,
              borderRadius: 8,
              padding: '8px 10px',
              background: `${s.color}08`,
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 10, color: s.color, marginBottom: 3, fontWeight: 700 }}>
              {s.phase}. {s.label}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>{s.sublabel}</div>
          </motion.div>
        ))}
      </div>

      {/* Entitlement badge */}
      <motion.div
        animate={ctrl}
        variants={badgeVariants}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          border: `1px solid ${GREEN}55`,
          borderRadius: 8,
          padding: '8px 14px',
          background: `${GREEN}0d`,
          fontFamily: MONO,
          fontSize: 11,
        }}
      >
        <span style={{ color: GREEN, fontWeight: 700 }}>Entitlement</span>
        <span style={{ color: '#8b98a8' }}>user_id=u_abc123</span>
        <span style={{ color: GREEN }}>plan=&quot;pro&quot;</span>
        <span style={{ color: '#8b98a8' }}>→ 1000 searches/mo</span>
      </motion.div>
    </div>
  );
}
