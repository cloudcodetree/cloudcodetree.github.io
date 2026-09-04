'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * FeatureContractGate — bespoke animation for Part 18 (Experiment tracking & model registry).
 *
 * Metaphor: a funnel / gate. Two lanes of runs flow toward a "model registry" output.
 * Left lane: the three fair-price runs on the same hand+emb16 feature contract — they
 * flow through the gate and compete. Right lane: the two documented-baseline runs
 * (hand-only) — they hit the gate and are deflected into an archive shelf. The gate
 * label makes the rule explicit: "same feature contract required."
 *
 * The key teaching moment: torch_baseline at $117.11 (lower than the winner $138.11)
 * is diverted into the archive because it ran on a different feature set — a cheaper
 * feature set does not produce a fair comparison.
 *
 * Numbers are real (run_tracking() on electronics-2026-07.json). Static-export-safe.
 */

type Lane = { name: string; mae: number; contract: 'fair-price' | 'documented-baseline'; selectable: boolean };

const SELECTABLE: Lane[] = [
  { name: 'linear',  mae: 257.85, contract: 'fair-price', selectable: true },
  { name: 'gbdt',    mae: 138.11, contract: 'fair-price', selectable: true },
  { name: 'torch',   mae: 149.21, contract: 'fair-price', selectable: true },
];

const BASELINES: Lane[] = [
  { name: 'linear_baseline', mae: 227.89, contract: 'documented-baseline', selectable: false },
  { name: 'torch_baseline',  mae: 117.11, contract: 'documented-baseline', selectable: false },
];

const ROW_H = 34;
const CARD_PAD = '5px 10px';
const WINNER = 'gbdt';

function RunCard({ lane, i, isWinner }: { lane: Lane; i: number; isWinner?: boolean }) {
  const color = isWinner ? ACCENT : lane.selectable ? '#cdd7e2' : 'rgba(148,163,184,0.55)';
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.25 }}
      transition={{ delay: 0.1 + i * 0.14, duration: 0.38 }}
      style={{
        fontFamily: MONO,
        fontSize: 11,
        padding: CARD_PAD,
        borderRadius: 6,
        border: `1px solid ${isWinner ? `${ACCENT}66` : lane.selectable ? 'rgba(47,129,247,0.25)' : 'rgba(210,153,34,0.20)'}`,
        background: isWinner
          ? 'rgba(148,188,227,0.10)'
          : lane.selectable
          ? 'rgba(47,129,247,0.06)'
          : 'rgba(210,153,34,0.06)',
        color,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        minWidth: 0,
        height: ROW_H,
      }}
    >
      <span style={{ fontWeight: isWinner ? 700 : 400 }}>{isWinner ? '* ' : ''}{lane.name}</span>
      <span style={{ color: isWinner ? ACCENT : 'rgba(148,163,184,0.7)' }}>${lane.mae}</span>
    </motion.div>
  );
}

export default function FeatureContractGate() {
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
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 4 }}>
        feature contract gate — who competes for the registry?
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        only runs on the same hand+emb16 feature set are selectable
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

        {/* --- selectable lane --- */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#94bce3', letterSpacing: '0.07em', marginBottom: 8 }}>
            fair-price contract · selectable=True
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SELECTABLE.map((lane, i) => (
              <RunCard key={lane.name} lane={lane} i={i} isWinner={lane.name === WINNER} />
            ))}
          </div>

          {/* flow arrow down to gate */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 4px' }}>
            <motion.div
              initial={{ scaleY: 0, originY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: 0.55, duration: 0.35 }}
              style={{ width: 2, height: 22, background: `${ACCENT}66`, borderRadius: 1 }}
            />
          </div>

          {/* registry output */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: 0.72, type: 'spring', stiffness: 260, damping: 18 }}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${ACCENT}77`,
              background: 'rgba(148,188,227,0.12)',
              color: ACCENT,
              textAlign: 'center' as const,
            }}
          >
            model registry<br />
            <span style={{ fontWeight: 400, color: '#cdd7e2' }}>dealfinder-fair-price</span><br />
            <span style={{ fontSize: 10, color: '#8b98a8' }}>winner: gbdt  MAE $138.11</span>
          </motion.div>
        </div>

        {/* --- gate divider --- */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: 0.4 }}
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: '#d29922',
              border: '1px solid rgba(210,153,34,0.35)',
              background: 'rgba(210,153,34,0.08)',
              borderRadius: 8,
              padding: '6px 8px',
              textAlign: 'center' as const,
              maxWidth: 80,
              lineHeight: 1.4,
            }}
          >
            feature<br />contract<br />gate
          </motion.div>
        </div>

        {/* --- baseline lane (excluded) --- */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#d29922', letterSpacing: '0.07em', marginBottom: 8 }}>
            documented-baseline · selectable=False
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {BASELINES.map((lane, i) => (
              <RunCard key={lane.name} lane={lane} i={i + 3} />
            ))}
          </div>

          {/* deflection arrow — into archive */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 4px' }}>
            <motion.div
              initial={{ scaleY: 0, originY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: 0.65, duration: 0.35 }}
              style={{ width: 2, height: 22, background: 'rgba(210,153,34,0.45)', borderRadius: 1 }}
            />
          </div>

          {/* archive shelf */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: 0.82, type: 'spring', stiffness: 260, damping: 18 }}
            style={{
              fontFamily: MONO,
              fontSize: 11,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(210,153,34,0.30)',
              background: 'rgba(210,153,34,0.06)',
              color: 'rgba(148,163,184,0.7)',
              textAlign: 'center' as const,
            }}
          >
            logged in MLflow<br />
            <span style={{ fontSize: 10 }}>hand-only features<br />different comparison</span>
          </motion.div>
        </div>
      </div>

      {/* footnote */}
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 16, lineHeight: 1.6 }}>
        torch_baseline at $117.11 is lower than the winner ($138.11) but was trained on hand-only features — a cheaper feature set inflates performance and is not a fair comparison. Logged for provenance; excluded from selection.
      </div>
    </div>
  );
}
