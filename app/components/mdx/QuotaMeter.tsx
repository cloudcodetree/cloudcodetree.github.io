'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of plan-gated usage metering for Part 30.
 *
 * Visual metaphor: two horizontal "fuel gauge" bars — one for the Free plan
 * (25 searches/mo), one for the Pro plan (1,000 searches/mo). The Free bar
 * fills to 25/25 then a "QUOTA EXCEEDED" label pulses in; the Pro bar fills
 * to a comfortable 347/1000 and stays green. The contrast makes the plan-gate
 * logic legible without any prose explanation.
 *
 * Distinct shapes: segmented horizontal bar (flat, not circular) — never used
 * elsewhere in the component library. The "wall" at the quota boundary is a
 * thin vertical red line that the free bar crashes into.
 *
 * Static-export-safe: all text is real DOM text. No runtime data fetch.
 */

const GREEN = '#3fb950';
const RED = '#f85149';
const BLUE = '#2f81f7';
const ORANGE = '#d29922';

interface GaugeProps {
  label: string;
  used: number;
  quota: number;
  color: string;
  blocked?: boolean;
  ctrl: ReturnType<typeof useAnimation>;
  delay?: number;
}

function PlanGauge({ label, used, quota, color, blocked = false, ctrl, delay = 0 }: GaugeProps) {
  const pct = Math.min(used / quota, 1);
  const barW = 260;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={ctrl}
      variants={{ visible: { opacity: 1, x: 0, transition: { delay, duration: 0.4 } } }}
      style={{ marginBottom: 22 }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
          fontFamily: MONO,
          fontSize: 11,
        }}
      >
        <span style={{ color, fontWeight: 700 }}>{label}</span>
        <span style={{ color: blocked ? RED : '#8b98a8' }}>
          {used.toLocaleString()} / {quota.toLocaleString()} searches this month
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: barW,
          height: 18,
          background: 'rgba(148,163,184,0.08)',
          borderRadius: 4,
          overflow: 'visible',
          border: '1px solid rgba(148,163,184,0.12)',
        }}
      >
        {/* Fill */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={ctrl}
          variants={{
            visible: {
              scaleX: pct,
              transition: { delay: delay + 0.2, duration: 0.9, ease: 'easeOut' as const },
            },
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '100%',
            transformOrigin: 'left center',
            background: blocked
              ? `linear-gradient(90deg, ${color}cc, ${RED}cc)`
              : `${color}cc`,
            borderRadius: 4,
          }}
        />

        {/* Quota wall (red vertical line at 100%) */}
        {blocked && (
          <div
            style={{
              position: 'absolute',
              top: -3,
              right: 0,
              bottom: -3,
              width: 2,
              background: RED,
              borderRadius: 1,
            }}
          />
        )}

        {/* Usage label inside bar */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            fontFamily: MONO,
            fontSize: 10,
            color: 'rgba(255,255,255,0.75)',
            pointerEvents: 'none',
          }}
        >
          {Math.round(pct * 100)}%
        </div>
      </div>

      {/* Blocked label */}
      {blocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={ctrl}
          variants={{
            visible: {
              opacity: [0, 0, 1, 0.6, 1],
              transition: {
                delay: delay + 1.1,
                duration: 1.4,
                times: [0, 0.3, 0.5, 0.75, 1],
                repeat: Infinity,
                repeatDelay: 1.0,
              },
            },
          }}
          style={{
            marginTop: 5,
            fontFamily: MONO,
            fontSize: 10,
            color: RED,
            letterSpacing: '0.08em',
          }}
        >
          QuotaExceeded — Free plan: 25 searches/mo exhausted → upgrade to Pro
        </motion.div>
      )}
    </motion.div>
  );
}

export default function QuotaMeter({ accent = ACCENT }: { accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const ctrl = useAnimation();

  useEffect(() => {
    if (isInView) ctrl.start('visible');
  }, [isInView, ctrl]);

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
        Plan-gated usage metering
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        meter_usage() raises QuotaExceeded when the plan limit is hit
      </div>

      <PlanGauge
        label="Free — 25 searches/mo"
        used={25}
        quota={25}
        color={ORANGE}
        blocked
        ctrl={ctrl}
        delay={0}
      />
      <PlanGauge
        label="Pro — 1,000 searches/mo"
        used={347}
        quota={1000}
        color={GREEN}
        blocked={false}
        ctrl={ctrl}
        delay={0.3}
      />

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={ctrl}
        variants={{ visible: { opacity: 1, y: 0, transition: { delay: 1.0, duration: 0.4 } } }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 8,
          fontFamily: MONO,
          fontSize: 10,
          color: '#8b98a8',
        }}
      >
        <span>
          <span style={{ color: ORANGE }}>free</span> → 25 searches/mo
        </span>
        <span>
          <span style={{ color: GREEN }}>pro</span> → 1,000 searches/mo
        </span>
        <span>
          <span style={{ color: BLUE }}>store</span> = any dict-like; in prod: Postgres row + monthly reset
        </span>
      </motion.div>
    </div>
  );
}
