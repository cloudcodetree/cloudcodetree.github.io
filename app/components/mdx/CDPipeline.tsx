'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of CD: a push flows through CI (lint, tests, the eval
 * gate), an image build, and a deploy — and only a green gate reaches prod. A
 * token advances stage by stage. Static-safe.
 */

const STAGES = [
  { label: 'git push', sub: 'to main' },
  { label: 'CI', sub: 'ruff · pytest · evals' },
  { label: 'build', sub: 'Docker image' },
  { label: 'deploy', sub: 'PaaS / cloud' },
  { label: 'live', sub: '/healthz ✓', good: true },
];

export default function CDPipeline({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)', overflowX: 'auto' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Push → tested → built → deployed
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 560 }}>
        {STAGES.map((s, i) => {
          const col = s.good ? '#3fb950' : accent;
          return (
            <div key={s.label} style={{ display: 'contents' }}>
              <motion.div
                style={{ flex: '1 1 0', textAlign: 'center', border: `1px solid ${col}59`, background: `${col}0d`, borderRadius: 9, padding: '10px 8px' }}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: i * 0.18 }}
              >
                <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#fff' }}>{s.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 2 }}>{s.sub}</div>
              </motion.div>
              {i < STAGES.length - 1 && (
                <motion.span
                  style={{ fontFamily: MONO, fontSize: 14, color: '#8b98a8', flex: '0 0 auto' }}
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: STAGES.length * 0.4, repeat: Infinity, delay: i * 0.4 }}
                >→</motion.span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        The <span style={{ color: accent }}>eval gate</span> (Part 19) sits inside CI — a precision@5 regression fails the build before it ever ships.
      </div>
    </div>
  );
}
