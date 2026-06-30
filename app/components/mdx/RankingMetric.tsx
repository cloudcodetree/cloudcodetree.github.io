'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of offline ranking metrics. A recommended list is shown
 * top-to-bottom; relevant hits are green. A dashed line marks the @k cutoff
 * (precision@k = hits above it / k). Each row also shows its NDCG discount
 * weight 1/log2(rank+1) as a shrinking bar — making concrete why a hit at rank 1
 * is worth more than the same hit at rank 5.
 *
 * Rows stagger in; hits pulse. Static-safe: ranks, hit marks, and weights are
 * real text/values.
 */

// recommended list: is each item relevant? (a hit)
const LIST = [
  { id: 'tent-26', hit: true },
  { id: 'tent-14', hit: false },
  { id: 'tent-17', hit: true },
  { id: 'tent-09', hit: false },
  { id: 'tent-22', hit: false },
  { id: 'tent-31', hit: false },
];
const K = 5;
const discount = (rank: number) => 1 / Math.log2(rank + 1); // rank is 1-based

export default function RankingMetric({ accent = ACCENT }: { accent?: string }) {
  const hitsAtK = LIST.slice(0, K).filter((x) => x.hit).length;

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Scoring a ranked list
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 14 }}>
        green = relevant · bar = NDCG rank credit
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
        {LIST.map((item, i) => {
          const rank = i + 1;
          const col = item.hit ? '#3fb950' : '#8b98a8';
          return (
            <div key={item.id}>
              {rank === K + 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                  <div style={{ flex: 1, borderTop: `1px dashed ${accent}73` }} />
                  <span style={{ fontFamily: MONO, fontSize: 9, color: accent }}>k = {K} cutoff</span>
                </div>
              )}
              <motion.div
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: i * 0.1 }}
              >
                <span style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', width: 16 }}>{rank}</span>
                <span style={{ width: 16, textAlign: 'center' }}>
                  <motion.span style={{ color: col, fontWeight: 700 }} animate={item.hit ? { opacity: [1, 0.4, 1] } : {}} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}>
                    {item.hit ? '✓' : '·'}
                  </motion.span>
                </span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: item.hit ? '#fff' : '#8b98a8', width: 78 }}>{item.id}</span>
                {/* NDCG discount bar */}
                <div style={{ flex: 1, height: 8, background: 'rgba(148,163,184,0.06)', borderRadius: 4, overflow: 'hidden', maxWidth: 180 }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 4, background: item.hit ? `${accent}` : 'rgba(148,163,184,0.25)' }}
                    initial={{ width: 0 }} whileInView={{ width: `${discount(rank) * 100}%` }} viewport={{ amount: 0.3 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                  />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', width: 30, textAlign: 'right' }}>{discount(rank).toFixed(2)}</span>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap', fontFamily: MONO, fontSize: 11, color: '#cdd7e2' }}>
        <span>precision@{K} = {hitsAtK}/{K} = <span style={{ color: accent }}>{(hitsAtK / K).toFixed(2)}</span></span>
        <span style={{ color: '#8b98a8' }}>· a hit at rank 1 earns 1.00, at rank 5 only 0.39 — order matters</span>
      </div>
    </div>
  );
}
