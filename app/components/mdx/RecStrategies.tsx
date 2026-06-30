'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration contrasting the two recommender strategies:
 *  - content-based: "more like this" — similarity over a product's own features
 *    (works with zero user history).
 *  - collaborative: "people who liked this also liked…" — a bipartite co-like
 *    graph; no features at all, pure taste.
 * The CF panel animates the actual inference: you and another user both liked A;
 * they also liked C; so C is recommended to you. Static-safe (labels are real).
 */

const card = {
  border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12,
  background: 'rgba(148,163,184,0.04)', padding: '14px 14px', flex: '1 1 250px', minWidth: 240,
};

export default function RecStrategies({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Two ways to recommend
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {/* content-based */}
        <div style={card}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#fff', fontWeight: 700, marginBottom: 2 }}>content-based</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 12 }}>more like this — by features</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#fff', border: `1.5px solid ${accent}73`, background: `${accent}12`, borderRadius: 7, padding: '6px 10px' }}>UL 2P Tent · 1.1kg</span>
            <motion.span style={{ color: accent, fontSize: 14 }} animate={{ y: [2, -2, 2], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>▼ similar specs</motion.span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['UL 2P · 1.2kg', 'UL 3P · 1.4kg'].map((t, i) => (
                <motion.span key={t}
                  style={{ fontFamily: MONO, fontSize: 10, color: '#cdd7e2', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 7, padding: '6px 8px' }}
                  initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.3 + i * 0.15 }}
                >{t}</motion.span>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 12, textAlign: 'center' }}>no history needed ✓</div>
        </div>

        {/* collaborative */}
        <div style={card}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#fff', fontWeight: 700, marginBottom: 2 }}>collaborative</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 6 }}>people who liked this also liked…</div>
          <svg viewBox="0 0 240 150" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* edges */}
            <motion.line x1="44" y1="46" x2="196" y2="32" stroke={accent} strokeWidth="2" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 0.7 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2, duration: 0.5 }} />
            <motion.line x1="44" y1="104" x2="196" y2="32" stroke="#8b98a8" strokeWidth="2" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 0.6 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.45, duration: 0.5 }} />
            <motion.line x1="44" y1="104" x2="196" y2="116" stroke="#8b98a8" strokeWidth="2" strokeDasharray="4 3" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 0.6 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.7, duration: 0.5 }} />
            {/* recommendation edge you → C */}
            <motion.line x1="44" y1="46" x2="196" y2="116" stroke={accent} strokeWidth="2.5" strokeDasharray="3 3" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: [0, 1, 0.5, 1] }} viewport={{ amount: 0.4 }} transition={{ pathLength: { delay: 1.1, duration: 0.5 }, opacity: { delay: 1.1, duration: 2, repeat: Infinity } }} />

            {/* users */}
            <g fontFamily="Menlo, monospace" fontSize="10">
              <circle cx="32" cy="46" r="12" fill={`${accent}22`} stroke={accent} /><text x="32" y="49" textAnchor="middle" fill="#fff">you</text>
              <circle cx="32" cy="104" r="12" fill="rgba(148,163,184,0.1)" stroke="#8b98a8" /><text x="32" y="107" textAnchor="middle" fill="#cdd7e2">u2</text>
              {/* items */}
              <circle cx="208" cy="32" r="12" fill="rgba(148,163,184,0.1)" stroke="#8b98a8" /><text x="208" y="35" textAnchor="middle" fill="#cdd7e2">A</text>
              <motion.circle cx="208" cy="116" r="13" fill={`${accent}22`} stroke={accent} strokeWidth="2"
                animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.6, repeat: Infinity, delay: 1.2 }} />
              <text x="208" y="119" textAnchor="middle" fill="#fff">C</text>
              <text x="208" y="140" textAnchor="middle" fill={accent} fontSize="9">recommend →</text>
            </g>
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 4, textAlign: 'center' }}>captures taste, not specs ✓</div>
        </div>
      </div>
    </div>
  );
}
