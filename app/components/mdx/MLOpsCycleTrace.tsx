'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * MLOpsCycleTrace — bespoke animation for Part 20 (Closing the MLOps loop).
 *
 * Visual metaphor: a vertical pipeline with four labelled "stations":
 *   1. Drift check  → PSI 0.3182 → DRIFT
 *   2. Retrain      → GBDT $138.11 vs linear $227.89
 *   3. Eval gate    → two_signal p@5=1.00 ≥ 0.80 → PASS
 *   4. Promote      → two_signal promoted over median_only (0.40)
 *
 * Each node lights up in sequence. Connector lines animate after each node.
 * All numbers are from real executed output (ground-truth wave5 document).
 * Static-export-safe.
 */

const STEPS = [
  {
    id: 'drift',
    label: 'Drift check',
    detail: 'PSI = 0.3182  ≥  threshold 0.2',
    verdict: 'DRIFT — retrain',
    verdictColor: '#f85149',
    icon: '◉',
  },
  {
    id: 'retrain',
    label: 'Retrain',
    detail: 'GBDT $138.11  vs  linear $227.89',
    verdict: '39.4% better · 202/68 split',
    verdictColor: ACCENT,
    icon: '⟳',
  },
  {
    id: 'gate',
    label: 'Eval gate',
    detail: 'two_signal  precision@5 = 1.00  ≥  0.80',
    verdict: 'PASS',
    verdictColor: ACCENT,
    icon: '⊙',
  },
  {
    id: 'promote',
    label: 'Promote',
    detail: 'two_signal (1.00) beats median_only (0.40)',
    verdict: 'PROMOTED',
    verdictColor: ACCENT,
    icon: '★',
  },
];

function StepNode({
  step,
  index,
  isLast,
}: {
  step: typeof STEPS[number];
  index: number;
  isLast: boolean;
}) {
  const delay = index * 0.35;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* node row */}
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.14)',
          background: 'rgba(43,43,45,0.5)',
        }}
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ amount: 0.4 }}
        transition={{ delay, duration: 0.4, ease: 'easeOut' as const }}
      >
        {/* step number badge */}
        <div
          style={{
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 700,
            color: ACCENT,
            minWidth: 22,
            lineHeight: 1.3,
          }}
        >
          {step.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', fontWeight: 600, marginBottom: 3 }}>
            {step.label}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 5 }}>
            {step.detail}
          </div>
          <motion.div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              color: step.verdictColor,
              border: `1px solid ${step.verdictColor}73`,
              background: `${step.verdictColor}14`,
              borderRadius: 5,
              padding: '3px 9px',
              display: 'inline-block',
            }}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 280, damping: 18 }}
          >
            {step.verdict}
          </motion.div>
        </div>
      </motion.div>

      {/* connector */}
      {!isLast && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
          <motion.div
            style={{ width: 2, background: 'rgba(148,163,184,0.20)', borderRadius: 1 }}
            initial={{ height: 0 }}
            whileInView={{ height: 24 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: delay + 0.5, duration: 0.25 }}
          />
        </div>
      )}
    </div>
  );
}

export default function MLOpsCycleTrace({ accent = ACCENT }: { accent?: string }) {
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
        run_mlops_cycle — headline trace
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        frac=0.3 · challenger=two_signal · champion=median_only
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {STEPS.map((step, i) => (
          <StepNode key={step.id} step={step} index={i} isLast={i === STEPS.length - 1} />
        ))}
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          borderTop: '1px solid rgba(148,163,184,0.10)',
          paddingTop: 12,
          marginTop: 14,
        }}
      >
        All values measured — deterministic, offline, against the committed snapshot.
        <br />
        CycleDecision.trace records the full reasoning; nothing is a shrug.
      </div>
    </div>
  );
}
