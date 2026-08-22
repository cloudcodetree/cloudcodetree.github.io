'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * BoostingResidual — the MECHANISM of gradient boosting (Part 21), the companion
 * to BoostingLift (which shows the MAE result). Three panels, left→right: each new
 * tree fits the LEFTOVER error (residual) of the ensemble so far, so the prediction
 * creeps toward the data and the residual arrows shrink each round.
 *
 * Illustrative points (the concept, not pinned numbers — real MAE lives in
 * BoostingLift). Static SVG geometry + framer opacity reveal = hydration-safe.
 */

const RED = '#f85149';
const GREEN = '#94bce3';

// 6 points (svg coords in a 120x90 plot). y grows DOWN in svg.
const PTS = [
  { x: 12, y: 70 }, { x: 32, y: 52 }, { x: 52, y: 58 },
  { x: 72, y: 34 }, { x: 92, y: 40 }, { x: 108, y: 20 },
];

// prediction y for each point, per round. round 0 = flat mean; then it bends toward the points.
const PRED = [
  [46, 46, 46, 46, 46, 46],          // round 1: predict the mean (flat)
  [64, 52, 54, 42, 44, 30],          // round 2: + a tree on the residuals
  [70, 52, 57, 36, 41, 22],          // round 3: + another tree (nearly there)
];

const ROUNDS = [
  { title: 'round 1', sub: 'predict the mean', err: 'big residuals' },
  { title: 'round 2', sub: '+ tree on residuals', err: 'smaller' },
  { title: 'round 3', sub: '+ another tree', err: 'tiny' },
];

function Panel({ r, accent }: { r: number; accent: string }) {
  const pred = PRED[r];
  // build the prediction polyline
  const line = PTS.map((p, i) => `${p.x},${pred[i]}`).join(' ');
  return (
    <div style={{ flex: '1 1 150px', minWidth: 140 }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: '#cdd7e2', marginBottom: 4 }}>
        <b style={{ color: accent }}>{ROUNDS[r].title}</b> · {ROUNDS[r].sub}
      </div>
      <svg viewBox="0 0 120 90" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* residual arrows: from prediction to actual point */}
        {PTS.map((p, i) => (
          <line key={`res${i}`} x1={p.x} y1={pred[i]} x2={p.x} y2={p.y}
            stroke={RED} strokeWidth="1.4" opacity={0.75} />
        ))}
        {/* prediction line */}
        <polyline points={line} fill="none" stroke={accent} strokeWidth="2" opacity={0.9} />
        {/* actual points */}
        {PTS.map((p, i) => (
          <circle key={`pt${i}`} cx={p.x} cy={p.y} r="3.2" fill={GREEN} />
        ))}
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 10, color: RED, textAlign: 'center', marginTop: 2 }}>
        error: {ROUNDS[r].err}
      </div>
    </div>
  );
}

export default function BoostingResidual({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Gradient boosting — each tree fits the previous ensemble&apos;s residual
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 14 }}>
        <span style={{ color: GREEN }}>● actual price</span> · <span style={{ color: accent }}>— prediction</span> · <span style={{ color: RED }}>| residual (leftover error)</span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[0, 1, 2].map((r) => (
          <motion.div key={r} style={{ flex: '1 1 150px', minWidth: 140 }}
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }} transition={{ delay: r * 0.25 }}>
            <Panel r={r} accent={accent} />
          </motion.div>
        ))}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        A single tree is weak. Boosting adds them in sequence — tree <i>k+1</i> is trained on what
        tree <i>k</i> got wrong (the red residuals), so the ensemble <b style={{ color: GREEN }}>creeps toward the data</b> round by round.
        That is why GBDT beats one big tree — and why it can overfit if you let it run too long.
      </div>
    </div>
  );
}
