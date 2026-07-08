'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * CacheThresholdKnob — bespoke animation for Part 23 (Inference optimization).
 *
 * Metaphor: a threshold dial / sliding gate. Two cosine similarity values for
 * the Sony WH-1000XM5 near-duplicate pair (0.9498) sit above a moveable
 * threshold line. At 0.95 the pair misses (cache miss); drop to 0.90 and the
 * pair crosses the gate (cache hit). Real measured numbers from
 * measure_cache_hit_rate() on the committed 14-query batch.
 *
 * Static-safe. All numbers are MEASURED.
 */

// Real measured values from ground truth (wave5-ground-truth.md)
const AT_095 = { threshold: 0.95, hits: 6, total: 14, hitRate: 0.429 };
const AT_090 = { threshold: 0.90, hits: 7, total: 14, hitRate: 0.500 };
const XM5_COSINE = 0.9498; // the real near-duplicate pair cosine

// Pairs to visualize: [label, cosine, isNearDup]
type Pair = { label: string; cosine: number; nearDup: boolean };
const PAIRS: Pair[] = [
  { label: 'Anker Q20i (exact repeat)',   cosine: 1.000, nearDup: false },
  { label: 'Sony XM5 at Costco',          cosine: 1.000, nearDup: false },
  { label: 'Bose QC45 (exact repeat)',    cosine: 1.000, nearDup: false },
  { label: 'XM5 Costco vs XM5 Macy\'s',  cosine: XM5_COSINE, nearDup: true },
  { label: 'JBL Tune 770 (repeat)',       cosine: 1.000, nearDup: false },
  { label: 'Samsung Galaxy Buds (rephrase)', cosine: 0.873, nearDup: false },
];

const CHART_W_PX = 220; // logical width for the cosine axis

function cosPx(cosine: number): number {
  // map [0.80, 1.00] → [0, CHART_W_PX]
  return Math.round(((cosine - 0.80) / 0.20) * CHART_W_PX);
}

export default function CacheThresholdKnob({ accent = ACCENT }: { accent?: string }) {
  const threshold095Px = cosPx(0.95);
  const threshold090Px = cosPx(0.90);
  const xm5Px          = cosPx(XM5_COSINE);

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      {/* header */}
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Semantic cache · threshold is the governing knob
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 18 }}>
        14-query batch · cosine similarity axis · measured offline, fastembed BAAI/bge-small-en-v1.5 384-dim
      </div>

      {/* axis + pairs */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        {/* axis bar */}
        <div style={{ height: 2, background: 'rgba(148,163,184,0.18)', borderRadius: 2, width: CHART_W_PX, position: 'relative', marginBottom: 28 }}>
          {/* axis labels */}
          <div style={{ position: 'absolute', left: 0, top: 8, fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>0.80</div>
          <div style={{ position: 'absolute', left: CHART_W_PX / 2 - 10, top: 8, fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>0.90</div>
          <div style={{ position: 'absolute', right: 0, top: 8, fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>1.00</div>

          {/* threshold at 0.95 — drops in first */}
          <motion.div
            style={{ position: 'absolute', top: -22, left: threshold095Px - 1, width: 2, height: 22, background: '#d29922', borderRadius: 2 }}
            initial={{ scaleY: 0, transformOrigin: 'top' }}
            whileInView={{ scaleY: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          />
          <motion.div
            style={{ position: 'absolute', top: -30, left: threshold095Px - 16, fontFamily: MONO, fontSize: 9, color: '#d29922', whiteSpace: 'nowrap' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.5 }}
          >
            0.95
          </motion.div>

          {/* threshold at 0.90 — drops in after */}
          <motion.div
            style={{ position: 'absolute', top: -22, left: threshold090Px - 1, width: 2, height: 22, background: '#3fb950', borderRadius: 2 }}
            initial={{ scaleY: 0, transformOrigin: 'top' }}
            whileInView={{ scaleY: 1 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          />
          <motion.div
            style={{ position: 'absolute', top: -30, left: threshold090Px - 16, fontFamily: MONO, fontSize: 9, color: '#3fb950', whiteSpace: 'nowrap' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.8 }}
          >
            0.90
          </motion.div>

          {/* XM5 near-dup marker */}
          <motion.div
            style={{ position: 'absolute', top: -10, left: xm5Px - 4, width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}80` }}
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 1.0, type: 'spring', stiffness: 280 }}
          />
          <motion.div
            style={{ position: 'absolute', top: 14, left: xm5Px - 30, fontFamily: MONO, fontSize: 8, color: accent, whiteSpace: 'nowrap' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }} transition={{ delay: 1.1 }}
          >
            XM5 pair {XM5_COSINE}
          </motion.div>
        </div>
      </div>

      {/* result table */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        {/* at 0.95 */}
        <motion.div
          style={{ flex: '1 1 180px', minWidth: 160, padding: '10px 14px', background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.3)', borderRadius: 8 }}
          initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.4 }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#d29922', marginBottom: 6 }}>threshold = 0.95</div>
          <div style={{ fontFamily: MONO, fontSize: 14, color: '#cdd7e2', marginBottom: 2 }}>
            {AT_095.hits}/{AT_095.total} hits
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#d29922', marginBottom: 4 }}>
            hit rate {AT_095.hitRate}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>
            exact repeats only · XM5 pair (0.9498) MISSES
          </div>
        </motion.div>

        {/* at 0.90 */}
        <motion.div
          style={{ flex: '1 1 180px', minWidth: 160, padding: '10px 14px', background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 8 }}
          initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.6 }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, color: '#3fb950', marginBottom: 6 }}>threshold = 0.90</div>
          <div style={{ fontFamily: MONO, fontSize: 14, color: '#cdd7e2', marginBottom: 2 }}>
            {AT_090.hits}/{AT_090.total} hits
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#3fb950', marginBottom: 4 }}>
            hit rate {AT_090.hitRate}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>
            XM5 pair (0.9498 ≥ 0.90) now HITS
          </div>
        </motion.div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 14 }}>
        One threshold change: the Sony WH-1000XM5 near-duplicate (cosine 0.9498, measured) goes from cache miss to hit.
        Lower threshold = higher recall, higher risk of serving a stale answer.
      </div>
    </div>
  );
}
