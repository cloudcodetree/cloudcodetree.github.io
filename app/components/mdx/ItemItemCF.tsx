'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * ItemItemCF — the mechanism behind collaborative_recommend (P4): a users×items
 * 0/1 matrix, and "similarity" = how many users liked both items (column·column
 * dot product). Mini 6-user × 5-item grid keyed to the lesson's XM5 anchor.
 * Div grid + framer opacity = hydration-safe.
 */

const GREEN = '#3fb950';
const MUT = '#8b98a8';

const ITEMS = ['XM5', 'XM6', 'Beats', 'CH720', 'Cable'];
// 6 users × 5 items; XM5 likers are rows 0,1,2,4
const M = [
  [1, 1, 1, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 0, 1, 1, 0],
  [0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0],
  [0, 0, 1, 0, 1],
];
// co-likes with XM5 per item column (computed over XM5-liker rows): [–, 3, 2, 1, 0]
const CO = ['—', '3', '2', '1', '0'];

export default function ItemItemCF({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        Item–item CF — count who liked both
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginBottom: 14 }}>
        the whole input is a users × items 0/1 matrix — no titles, no prices, no features
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${ITEMS.length}, 46px)`, gap: 4, alignItems: 'center' }}>
        <div />
        {ITEMS.map((it, c) => (
          <div key={it} style={{ fontFamily: MONO, fontSize: 10, color: c === 0 ? accent : MUT, fontWeight: c === 0 ? 700 : 400, textAlign: 'center' }}>{it}</div>
        ))}
        {M.map((row, r) => {
          const likesXm5 = row[0] === 1;
          return [
            <div key={`u${r}`} style={{ fontFamily: MONO, fontSize: 10, color: likesXm5 ? '#cdd7e2' : MUT, opacity: likesXm5 ? 1 : 0.55 }}>u{r + 1}{likesXm5 ? ' ►' : ''}</div>,
            ...row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                style={{
                  height: 20, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: MONO, fontSize: 10,
                  background: c === 0 ? `${accent}1f` : likesXm5 && v ? 'rgba(63,185,80,0.14)' : 'rgba(148,163,184,0.06)',
                  border: c === 0 ? `1px solid ${accent}55` : likesXm5 && v ? `1px solid ${GREEN}55` : '1px solid rgba(148,163,184,0.12)',
                  color: v ? (c === 0 ? accent : likesXm5 ? GREEN : MUT) : 'rgba(148,163,184,0.35)',
                  opacity: likesXm5 || c === 0 ? 1 : 0.55,
                }}
              >
                {v ? '✓' : '·'}
              </div>
            )),
          ];
        })}
        {/* co-occurrence score row */}
        <motion.div style={{ fontFamily: MONO, fontSize: 9, color: accent, gridColumn: '1' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.3 }}>co-likes</motion.div>
        {CO.map((s, c) => (
          <motion.div
            key={`co${c}`}
            style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textAlign: 'center', color: c === 1 ? GREEN : c === 0 ? MUT : '#cdd7e2' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.3 + c * 0.08 }}
          >
            {s}
          </motion.div>
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 14, lineHeight: 1.6 }}>
        Four users liked the <b style={{ color: accent }}>XM5</b> (marked ►). Among them, <b style={{ color: GREEN }}>3 also liked the XM6</b>, 2 the Beats, 1 the CH720, 0 the cable — so the recommendation order is XM6 → Beats → CH720, and the cable never surfaces. That count is just the <b style={{ color: '#cdd7e2' }}>dot product of two item columns</b> of the 0/1 matrix — which is exactly what <code>R.T</code> gives <code>collaborative_recommend</code> for every item pair at once. Items you already liked get <code>−inf</code> so they can&apos;t be re-recommended. No feature ever entered the computation: the signal is purely <i>taste</i>, which is why CF can cross brands in ways a title embedding never will.
      </div>
    </div>
  );
}
