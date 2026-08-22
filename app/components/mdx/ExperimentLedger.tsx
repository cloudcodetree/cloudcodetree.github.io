'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * ExperimentLedger — bespoke animation for Part 18 (Experiment tracking & model registry).
 *
 * Metaphor: a ledger of runs being filled in one row at a time. Each row appears
 * with a brief pause to imply the model was just trained. The winner row pulses
 * green; the non-selectable baselines are visually dimmed and tagged
 * "documented-baseline" in amber. The goal is to make the core tracking concept
 * tangible: every run is recorded, the comparison is transparent, and the winner
 * is identified by rule (lowest MAE among selectable runs).
 *
 * Numbers are REAL: from run_tracking() on electronics-2026-07.json, seed=0.
 * Non-selectable baselines are tagged "documented-baseline" exactly as in the code.
 * Static-export-safe.
 */

type Run = {
  name: string;
  mae: number;
  r2: string;
  contract: 'fair-price' | 'documented-baseline';
  selectable: boolean;
  winner: boolean;
};

const RUNS: Run[] = [
  { name: 'linear',           mae: 257.85, r2: '0.010', contract: 'fair-price',          selectable: true,  winner: false },
  { name: 'gbdt',             mae: 138.11, r2: '0.727', contract: 'fair-price',          selectable: true,  winner: true  },
  { name: 'torch',            mae: 149.21, r2: 'n/a',   contract: 'fair-price',          selectable: true,  winner: false },
  { name: 'linear_baseline',  mae: 227.89, r2: 'n/a',   contract: 'documented-baseline', selectable: false, winner: false },
  { name: 'torch_baseline',   mae: 117.11, r2: 'n/a',   contract: 'documented-baseline', selectable: false, winner: false },
];

const COL_W = { name: 160, mae: 80, r2: 60, contract: 160, badge: 90 };

function HeaderCell({ w, children }: { w: number; children: string }) {
  return (
    <div style={{ width: w, flex: `0 0 ${w}px`, fontFamily: MONO, fontSize: 10, color: '#8b98a8', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

function Row({ run, i }: { run: Run; i: number }) {
  const baseColor = run.selectable ? '#cdd7e2' : 'rgba(148,163,184,0.45)';
  const winnerGlow = run.winner ? { boxShadow: `0 0 0 1px ${ACCENT}55, 0 2px 12px rgba(148,188,227,0.15)` } : {};
  const bg = run.winner
    ? 'rgba(148,188,227,0.07)'
    : run.selectable
    ? 'rgba(148,163,184,0.03)'
    : 'transparent';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ amount: 0.25 }}
      transition={{ delay: 0.15 + i * 0.18, duration: 0.45, ease: 'easeOut' as const }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '7px 10px',
        borderRadius: 7,
        background: bg,
        border: run.winner ? `1px solid ${ACCENT}44` : '1px solid transparent',
        ...winnerGlow,
      }}
    >
      {/* name */}
      <div style={{ width: COL_W.name, flex: `0 0 ${COL_W.name}px`, fontFamily: MONO, fontSize: 12, color: run.winner ? ACCENT : baseColor, fontWeight: run.winner ? 700 : 400 }}>
        {run.winner ? '* ' : '  '}{run.name}
      </div>

      {/* MAE */}
      <div style={{ width: COL_W.mae, flex: `0 0 ${COL_W.mae}px`, fontFamily: MONO, fontSize: 12, color: run.winner ? ACCENT : baseColor, fontWeight: run.winner ? 700 : 400 }}>
        ${run.mae}
      </div>

      {/* R² */}
      <div style={{ width: COL_W.r2, flex: `0 0 ${COL_W.r2}px`, fontFamily: MONO, fontSize: 12, color: baseColor }}>
        {run.r2}
      </div>

      {/* contract tag */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            padding: '2px 7px',
            borderRadius: 5,
            color: run.selectable ? '#94bce3' : '#d29922',
            background: run.selectable ? 'rgba(47,129,247,0.10)' : 'rgba(210,153,34,0.10)',
            border: `1px solid ${run.selectable ? 'rgba(47,129,247,0.30)' : 'rgba(210,153,34,0.30)'}`,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {run.contract}
        </span>
      </div>

      {/* winner badge */}
      {run.winner && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ amount: 0.25 }}
          transition={{ delay: 0.55 + i * 0.18, type: 'spring', stiffness: 280, damping: 18 }}
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            color: ACCENT,
            border: `1px solid ${ACCENT}88`,
            background: 'rgba(148,188,227,0.12)',
            borderRadius: 6,
            padding: '3px 9px',
            whiteSpace: 'nowrap' as const,
          }}
        >
          REGISTERED
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ExperimentLedger() {
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
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
        experiment: dealfinder-price-models
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        5 runs · winner selected by MAE over fair-price contract · registered as dealfinder-fair-price
      </div>

      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 10px 6px', borderBottom: '1px solid rgba(148,163,184,0.12)', marginBottom: 6 }}>
        <HeaderCell w={COL_W.name}>model</HeaderCell>
        <HeaderCell w={COL_W.mae}>MAE ($)</HeaderCell>
        <HeaderCell w={COL_W.r2}>R²</HeaderCell>
        <div style={{ flex: 1, fontFamily: MONO, fontSize: 10, color: '#8b98a8', letterSpacing: '0.06em' }}>contract</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 520 }}>
        {RUNS.map((run, i) => (
          <Row key={run.name} run={run} i={i} />
        ))}
      </div>

      {/* footnote */}
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.10)' }}>
        * winner · documented-baseline runs are logged but excluded from registry selection — a lower MAE on a different feature set is not a fair win
      </div>
    </div>
  );
}
