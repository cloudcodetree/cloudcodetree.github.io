'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of container parity: one image, built once, runs
 * identically across dev / staging / prod — the structural fix for
 * "works on my machine". The image fans out to three identical environments.
 * Static-safe.
 */

const ENVS = ['dev', 'staging', 'prod'];

export default function ContainerParity({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Build once, run anywhere — identically
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* the image */}
        <motion.div
          style={{ flex: '0 0 auto', textAlign: 'center', border: `1.5px solid ${accent}73`, background: `${accent}12`, borderRadius: 10, padding: '14px 18px' }}
          animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#fff' }}>dealfinder:sha</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 3 }}>one image · pinned deps</div>
        </motion.div>

        <span style={{ fontFamily: MONO, fontSize: 16, color: accent }}>→</span>

        {/* three identical environments */}
        <div style={{ display: 'flex', gap: 10, flex: '1 1 280px', flexWrap: 'wrap' }}>
          {ENVS.map((e, i) => (
            <motion.div
              key={e}
              style={{ flex: '1 1 80px', minWidth: 78, textAlign: 'center', border: '1px solid rgba(148,163,184,0.22)', borderRadius: 9, padding: '12px 8px' }}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12 }}
            >
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2' }}>{e}</div>
              <motion.div
                style={{ marginTop: 6, fontFamily: MONO, fontSize: 10, color: '#94bce3' }}
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >✓ same bits</motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        No "works on my machine" — the bytes that passed CI are the bytes in prod.
      </div>
    </div>
  );
}
