'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * PSI Gauge — bespoke animation for Part 20 (Closing the MLOps loop).
 *
 * Shows two deterministic PSI readings from check_drift():
 *   mild  shift frac=0.1 → PSI 0.043  (below threshold 0.2 — hold)
 *   strong shift frac=0.3 → PSI 0.318 (above threshold 0.2 — retrain)
 *
 * Visual metaphor: a horizontal "thermometer" bar where the fill races toward
 * the PSI value. The threshold line is a fixed vertical marker. Real numbers
 * from ground-truth execution. Static-export-safe.
 */

const THRESHOLD = 0.2;
const MAX_PSI = 0.5; // display ceiling (both real values sit comfortably below)

const READINGS = [
  { label: 'frac=0.1 (mild shift)', psi: 0.043, action: 'hold',    actionColor: '#94bce3' },
  { label: 'frac=0.3 (strong shift)', psi: 0.318, action: 'retrain', actionColor: '#f85149' },
];

function GaugeBar({
  label,
  psi,
  action,
  actionColor,
  delay,
}: {
  label: string;
  psi: number;
  action: string;
  actionColor: string;
  delay: number;
}) {
  const fillPct = (psi / MAX_PSI) * 100;
  const thresholdPct = (THRESHOLD / MAX_PSI) * 100;
  const drifted = psi >= THRESHOLD;
  const barColor = drifted ? '#f85149' : ACCENT;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2' }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: drifted ? '#f85149' : ACCENT, fontWeight: 700 }}>
          PSI = {psi}
        </span>
      </div>

      {/* bar track */}
      <div style={{ position: 'relative', height: 18, background: 'rgba(148,163,184,0.10)', borderRadius: 9, overflow: 'visible' }}>
        {/* fill */}
        <motion.div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            background: barColor,
            borderRadius: 9,
            transformOrigin: 'left center',
          }}
          initial={{ width: '0%' }}
          whileInView={{ width: `${fillPct}%` }}
          viewport={{ amount: 0.5 }}
          transition={{ delay, duration: 0.8, ease: 'easeOut' as const }}
        />

        {/* threshold line */}
        <div
          style={{
            position: 'absolute',
            left: `${thresholdPct}%`,
            top: -6, bottom: -6,
            width: 2,
            background: '#d29922',
            borderRadius: 1,
            zIndex: 2,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>0</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: '#d29922' }}>↑ threshold 0.2</span>
        <motion.span
          style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700,
            color: actionColor,
            border: `1px solid ${actionColor}73`,
            background: `${actionColor}14`,
            borderRadius: 5,
            padding: '2px 8px',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.5 }}
          transition={{ delay: delay + 0.8, duration: 0.3 }}
        >
          → {action}
        </motion.span>
      </div>
    </div>
  );
}

export default function PSIGauge({ accent = ACCENT }: { accent?: string }) {
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
        population stability index — two scenarios
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        check_drift(frac) → PSI vs threshold 0.2 → hold or retrain
      </div>

      {READINGS.map((r, i) => (
        <GaugeBar key={r.label} {...r} delay={0.15 + i * 0.4} />
      ))}

      {/* per-bin arithmetic for the frac=0.3 reading — real values from check_drift */}
      <div style={{ borderTop: '1px solid rgba(148,163,184,0.10)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, color: '#cdd7e2', marginBottom: 8 }}>
          Where 0.318 comes from — per category bin: <span style={{ color: accent }}>PSI = Σ (cur − ref) · ln(cur / ref)</span>
        </div>
        {[
          { bin: 'audio', move: '22.2% → 15.6%', c: '+0.024', hot: false },
          { bin: 'peripherals', move: '16.7% → 11.7%', c: '+0.018', hot: false },
          { bin: 'displays', move: '5.6% → 13.9%', c: '+0.076', hot: true },
          { bin: 'computers', move: '5.6% → 13.9%', c: '+0.076', hot: true },
          { bin: 'misc', move: '5.6% → 13.9%', c: '+0.076', hot: true },
          { bin: '6 other bins', move: 'each shrinks a little', c: '+0.047', hot: false },
        ].map((r) => (
          <div key={r.bin} style={{ display: 'flex', gap: 8, fontFamily: MONO, fontSize: 10, marginBottom: 3 }}>
            <span style={{ width: 90, color: r.hot ? '#f85149' : '#8b98a8' }}>{r.bin}</span>
            <span style={{ width: 150, color: '#8b98a8' }}>{r.move}</span>
            <span style={{ color: r.hot ? '#f85149' : '#cdd7e2', fontWeight: r.hot ? 700 : 400 }}>{r.c}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, fontFamily: MONO, fontSize: 10, marginTop: 5, paddingTop: 5, borderTop: '1px dashed rgba(148,163,184,0.2)' }}>
          <span style={{ width: 90, color: '#cdd7e2', fontWeight: 700 }}>Σ</span>
          <span style={{ width: 150 }} />
          <span style={{ color: '#f85149', fontWeight: 700 }}>0.318 ≥ 0.2 → retrain</span>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', borderTop: '1px solid rgba(148,163,184,0.10)', paddingTop: 12, marginTop: 12, lineHeight: 1.6 }}>
        Each bin&apos;s term <code>(cur − ref) · ln(cur / ref)</code> is never negative — if a bin grew, both factors are positive; if it shrank, both are negative. So every moved bin <i>adds</i> drift and nothing cancels: PSI only reads zero when the mix truly hasn&apos;t moved. Both readings are deterministic and offline — the same shift fraction always produces the same PSI.
      </div>
    </div>
  );
}
