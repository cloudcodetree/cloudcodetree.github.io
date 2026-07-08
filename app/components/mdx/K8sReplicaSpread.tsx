'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of Kubernetes HPA replica spread.
 *
 * The HPA watches average CPU across pods. When utilisation crosses the 70%
 * target it schedules more replicas (up to maxReplicas: 10); a 120-second
 * stabilisation window prevents premature scale-in. This animation cycles
 * through four phases so the concept is visible at a glance.
 *
 * Real values from infra/k8s/hpa.yaml:
 *   minReplicas: 2 · maxReplicas: 10 · averageUtilization: 70
 *   stabilizationWindowSeconds: 120
 *
 * Static-export-safe. No runtime data fetch. Framer Motion only.
 */

interface Phase {
  count: number;
  cpu: number;
  label: string;
}

const PHASES: Phase[] = [
  { count: 2, cpu: 28, label: 'idle — 2 replicas' },
  { count: 2, cpu: 79, label: 'spike — threshold crossed (79% > 70%)' },
  { count: 5, cpu: 43, label: 'scaled out — CPU shared across 5 pods' },
  { count: 2, cpu: 21, label: 'cooldown — stabilised, scale-in after 120 s' },
];

function CpuBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? '#f85149' : pct >= 50 ? '#f0883e' : '#3fb950';
  return (
    <div
      style={{
        marginTop: 5,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 3,
        height: 5,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{ height: '100%', borderRadius: 3, background: color, originX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
    </div>
  );
}

export default function K8sReplicaSpread({ accent = ACCENT }: { accent?: string }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhaseIdx((p) => (p + 1) % PHASES.length), 2600);
    return () => clearInterval(id);
  }, []);

  const phase = PHASES[phaseIdx];

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
      {/* header */}
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
        HPA — minReplicas: 2 · maxReplicas: 10 · targetCPU: 70%
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 16, minHeight: 16 }}>
        Phase:{' '}
        <span style={{ color: phase.cpu >= 70 ? '#f85149' : '#e6edf3' }}>{phase.label}</span>
      </div>

      {/* pod grid — AnimatePresence keeps exit/enter smooth on replica count change */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', minHeight: 90, marginBottom: 14 }}>
        <AnimatePresence mode="popLayout">
          {Array.from({ length: phase.count }).map((_, i) => (
            <motion.div
              key={`pod-${i}`}
              style={{
                flex: '0 0 auto',
                width: 92,
                border: `1px solid ${accent}55`,
                background: `${accent}0d`,
                borderRadius: 8,
                padding: '10px 10px 8px',
              }}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ delay: i * 0.08, duration: 0.28 }}
            >
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#e6edf3' }}>
                pod-{String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#3fb950' }}>/healthz ✓</div>
              <CpuBar pct={phase.cpu} />
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 3 }}>
                CPU {phase.cpu}%
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* status bar */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: '#8b98a8',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          paddingTop: 10,
        }}
      >
        replicas:{' '}
        <span style={{ color: accent }}>{phase.count}</span>
        &nbsp;·&nbsp;avg CPU:{' '}
        <span style={{ color: phase.cpu >= 70 ? '#f85149' : '#3fb950' }}>{phase.cpu}%</span>
        &nbsp;·&nbsp;threshold: 70%
        &nbsp;·&nbsp;scaleDown stabilisation: 120 s
      </div>
    </div>
  );
}
