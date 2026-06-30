'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Animated illustration of an offline, deterministic test suite: a test run is
 * fed from local fixtures (a mock + a saved file), the real network is never
 * touched, and the same result comes back every run. Framer Motion: flow dots
 * down the "fixtures" lane, a hard-blocked network lane, and a run log whose
 * identical lines replay on a loop to convey determinism.
 *
 *   <DeterministicRun
 *     label="Tests stay offline and deterministic"
 *     result="9 passed"
 *     sources={[{ label: 'respx mock', sub: 'fake HTTP response' }, …]}
 *   />
 *
 * Static-safe (real text in the DOM) and accent-themable. Reusable in any
 * verified tutorial that promises an offline, repeatable test suite.
 */

type Source = { label: string; sub?: string };

const card = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 10,
  background: 'rgba(148,163,184,0.05)',
  padding: '9px 12px',
};

function FlowDots({ color, blocked = false }: { color: string; blocked?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 28 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'block' }}
          animate={blocked ? { opacity: 0.12 } : { opacity: [0.15, 1, 0.15] }}
          transition={blocked ? {} : { duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function DeterministicRun({
  label = 'Tests stay offline and deterministic',
  result = '9 passed',
  runs = 3,
  sources = [
    { label: 'respx mock', sub: 'fake HTTP response' },
    { label: 'saved fixture', sub: 'tent.html on disk' },
  ],
  accent = ACCENT,
}: {
  label?: string;
  result?: string;
  runs?: number;
  sources?: Source[];
  accent?: string;
}) {
  const runLines = Array.from({ length: runs }, (_, i) => i);

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* test suite */}
        <motion.div
          style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ amount: 0.5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <motion.div
            style={{ border: `1.5px solid ${accent}`, color: accent, fontFamily: MONO, fontSize: 12, fontWeight: 600,
                     borderRadius: 999, padding: '10px 16px', background: `${accent}14`, whiteSpace: 'nowrap' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            pytest -q
          </motion.div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>test suite</span>
        </motion.div>

        {/* lanes: blocked network (top) + live fixtures (bottom) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '1 1 260px', minWidth: 220 }}>
          {/* network lane — never touched */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlowDots color="#f85149" blocked />
            <div style={{ ...card, flex: '1 1 auto', borderColor: 'rgba(248,81,73,0.35)', background: 'rgba(248,81,73,0.06)', opacity: 0.7, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: '#f85149', fontWeight: 700 }}>✕</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Network</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#f85149', marginLeft: 'auto' }}>never touched</span>
              </div>
            </div>
          </div>

          {/* fixtures lane — the real source of truth */}
          {sources.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlowDots color={accent} />
              <motion.div
                style={{ ...card, flex: '1 1 auto' }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.5 }}
                transition={{ delay: 0.1 + i * 0.12, type: 'spring', stiffness: 220, damping: 22 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: s.sub ? 4 : 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{s.label}</span>
                </div>
                {s.sub && <code style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>{s.sub}</code>}
              </motion.div>
            </div>
          ))}
        </div>

        {/* fixtures → run log flow */}
        <FlowDots color={accent} />

        {/* run log: identical lines replay on a loop = deterministic */}
        <motion.div
          style={{ ...card, flex: '1 1 170px', minWidth: 160, borderColor: `${accent}73`, background: `${accent}10` }}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.5 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 22 }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>same result, every run</div>
          {runLines.map((i) => (
            <motion.div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 12, color: '#cdd7e2' }}
              animate={{ opacity: [0.25, 1, 1, 0.25] }}
              transition={{ duration: runLines.length * 1.1, times: [0, 0.12, 0.88, 1], repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            >
              <span style={{ color: accent, fontWeight: 700 }}>✓</span>
              <span>{result}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
