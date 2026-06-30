'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of LoRA/QLoRA: the big base weight matrix is frozen (and,
 * for QLoRA, 4-bit quantized), while a tiny low-rank adapter (B·A) is the only
 * thing that trains. The frozen grid sits locked and dim; the small adapter
 * cells shimmer to signal "these are the trainable parameters." Static-safe.
 */

const ACCENT2 = '#a371f7';

function Grid({ rows, cols, cell = 12, gap = 3, trainable = false, accent }: { rows: number; cols: number; cell?: number; gap?: number; trainable?: boolean; accent: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            width: cell, height: cell, borderRadius: 2,
            background: trainable ? `${accent}` : 'rgba(148,163,184,0.18)',
          }}
          animate={trainable ? { opacity: [0.45, 1, 0.45] } : {}}
          transition={trainable ? { duration: 1.6, repeat: Infinity, delay: (i % cols) * 0.12 } : {}}
        />
      ))}
    </div>
  );
}

export default function LoRAAdapter({ accent = ACCENT2 }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Train a tiny adapter, freeze the giant
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* frozen base */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Grid rows={7} cols={7} accent={accent} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>🔒 base W — frozen, 4-bit</span>
        </div>

        <span style={{ fontFamily: MONO, fontSize: 20, color: '#8b98a8' }}>+</span>

        {/* low-rank adapter B·A */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Grid rows={7} cols={2} trainable accent={accent} />
            <span style={{ fontFamily: MONO, fontSize: 13, color: accent }}>·</span>
            <Grid rows={2} cols={7} trainable accent={accent} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: accent }}>B · A — trainable, ~0.1%</span>
        </div>

        <span style={{ fontFamily: MONO, fontSize: 20, color: '#8b98a8' }}>=</span>

        {/* result */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <motion.div
            style={{ fontFamily: MONO, fontSize: 12, color: '#fff', border: `1.5px solid ${accent}73`, background: `${accent}14`, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}
            animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2, repeat: Infinity }}
          >
            h = Wx + <span style={{ color: accent }}>BA</span>x
          </motion.div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>new behavior, same base</span>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        <span style={{ color: accent }}>LoRA</span>: only the rank-r adapter trains. <span style={{ color: accent }}>QLoRA</span>: the frozen base is 4-bit quantized too — so an 8B model fine-tunes on one consumer GPU.
      </div>
    </div>
  );
}
