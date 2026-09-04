'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Quantization — what actually happens to model weights (P10 QLoRA 4-bit, P27
 * inference). Continuous FP16 weights snap to a small set of discrete integer
 * levels via a scale factor: fewer bits per weight → less memory, with small
 * rounding error. Static SVG + framer opacity = hydration-safe.
 */

const GREEN = '#94bce3';
const AMBER = '#f0a30a';
const MUT = '#8b98a8';

// 7 weights: continuous y (fp16) and the nearest rung it snaps to (int4).
const RUNGS = [10, 22, 34, 46, 58]; // visible ladder lines (illustrative; real int4 = 16 levels)
const snap = (y: number) => RUNGS.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
const WEIGHTS = [14, 20, 31, 39, 44, 52, 57];

export default function Quantization({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        Quantization — snap continuous weights to a few levels
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* FP16 continuous */}
        <motion.div style={{ flex: '1 1 200px', minWidth: 190 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff', fontWeight: 700, marginBottom: 4 }}>FP16 — continuous (16 bits)</div>
          <svg viewBox="0 0 90 68" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <line x1="45" y1="6" x2="45" y2="62" stroke={MUT} strokeWidth="1" opacity="0.35" />
            {WEIGHTS.map((y, i) => (
              <circle key={i} cx="45" cy={y} r="3" fill={GREEN} />
            ))}
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 10, color: MUT, marginTop: 2 }}>any real value on the line</div>
        </motion.div>

        {/* arrow */}
        <div style={{ alignSelf: 'center', fontFamily: MONO, fontSize: 20, color: accent }}>→</div>

        {/* INT4 snapped */}
        <motion.div style={{ flex: '1 1 200px', minWidth: 190 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.15 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff', fontWeight: 700, marginBottom: 4 }}>INT4 — 16 levels (4 bits)</div>
          <svg viewBox="0 0 90 68" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* ladder rungs */}
            {RUNGS.map((y, i) => (
              <line key={`r${i}`} x1="30" y1={y} x2="60" y2={y} stroke={MUT} strokeWidth="1" opacity="0.5" />
            ))}
            {/* snap arrows + snapped dots */}
            {WEIGHTS.map((y, i) => {
              const s = snap(y);
              return (
                <g key={i}>
                  {Math.abs(s - y) > 1 && <line x1="45" y1={y} x2="45" y2={s} stroke={AMBER} strokeWidth="1" opacity="0.7" />}
                  <circle cx="45" cy={s} r="3" fill={GREEN} />
                </g>
              );
            })}
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 10, color: AMBER, marginTop: 2 }}>snapped to nearest rung (tiny rounding)</div>
        </motion.div>
      </div>

      {/* memory bars */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUT, width: 42 }}>FP16</span>
          <div style={{ height: 12, width: '80%', background: `${MUT}55`, borderRadius: 3 }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUT }}>16 bits/weight</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: MUT, width: 42 }}>INT4</span>
          <div style={{ height: 12, width: '20%', background: GREEN, borderRadius: 3 }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: GREEN, fontWeight: 700 }}>4 bits/weight → 4× less memory</span>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 14, lineHeight: 1.6 }}>
        Each weight is stored with fewer bits by mapping it (via a <b style={{ color: accent }}>scale factor</b>) to the nearest of a small set of integer levels — 4-bit = <b>16 levels</b>. That&apos;s the <b style={{ color: GREEN }}>4× memory cut</b>: 16 bits → 4 bits per weight. The cost is <b style={{ color: AMBER }}>rounding error</b> (the amber jumps). It&apos;s near-lossless on a <i>frozen</i> base — which is exactly why QLoRA quantizes the base to 4-bit and trains only the small high-precision LoRA adapter on top.
      </div>
    </div>
  );
}
