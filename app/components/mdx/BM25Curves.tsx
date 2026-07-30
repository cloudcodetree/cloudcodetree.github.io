'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * BM25Curves — the two ideas that make BM25 rank well (Part 5), which the code
 * shows but the prose never explains: IDF (rare terms weigh more) and term-
 * frequency saturation (repeated terms hit diminishing returns). Two static SVG
 * curves + framer opacity reveal = hydration-safe.
 */

const ACCENT2 = '#d29922';
const GREEN = '#3fb950';
const MUT = '#8b98a8';

// IDF curve: high for rare terms (low df), low for common (high df). Points on a 0..100 x, 0..70 y svg.
const IDF_PATH = 'M 8,10 C 30,20 45,50 95,62';
// TF saturation curve: rises fast then flattens.
const TF_PATH = 'M 8,62 C 30,20 55,16 95,12';

function Chart({
  title, xlabel, ylabel, path, color, marks,
}: { title: string; xlabel: string; ylabel: string; path: string; color: string; marks: { x: number; y: number; label: string; c: string }[] }) {
  return (
    <div style={{ flex: '1 1 220px', minWidth: 210 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff', fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <svg viewBox="0 0 105 78" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* axes */}
        <line x1="8" y1="70" x2="100" y2="70" stroke={MUT} strokeWidth="1" opacity="0.5" />
        <line x1="8" y1="8" x2="8" y2="70" stroke={MUT} strokeWidth="1" opacity="0.5" />
        {/* curve */}
        <path d={path} fill="none" stroke={color} strokeWidth="2.2" />
        {/* marker dots + labels */}
        {marks.map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r="3" fill={m.c} />
          </g>
        ))}
        <text x="54" y="77.5" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="5.5" fill={MUT}>{xlabel}</text>
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 10, color: MUT, marginTop: 2 }}>y = {ylabel}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
        {marks.map((m, i) => (
          <span key={i} style={{ fontFamily: MONO, fontSize: 10, color: m.c }}>● {m.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function BM25Curves({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        What makes BM25 rank well — IDF + saturation
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <motion.div style={{ flex: '1 1 220px', minWidth: 210 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }}>
          <Chart
            title="1 · IDF — rare terms matter more"
            xlabel="how many titles contain the word →"
            ylabel="weight"
            path={IDF_PATH}
            color={accent}
            marks={[
              { x: 14, y: 13, label: '"770NC" (rare → high)', c: GREEN },
              { x: 90, y: 60, label: '"noise" (in every title → ~0)', c: MUT },
            ]}
          />
        </motion.div>
        <motion.div style={{ flex: '1 1 220px', minWidth: 210 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.15 }}>
          <Chart
            title="2 · Saturation — repeats give diminishing returns"
            xlabel="times the word repeats in one title →"
            ylabel="score contribution"
            path={TF_PATH}
            color={ACCENT2}
            marks={[
              { x: 22, y: 27, label: '1st hit: big jump', c: GREEN },
              { x: 90, y: 12.5, label: '5th hit: barely moves', c: MUT },
            ]}
          />
        </motion.div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 14, lineHeight: 1.6 }}>
        <b style={{ color: accent }}>IDF</b> (the <code>self.idf</code> term) down-weights words that appear in every title — matching <i>&quot;noise&quot;</i> tells you nothing; matching a rare model number <i>&quot;770NC&quot;</i> is highly distinctive.
        {' '}<b style={{ color: ACCENT2 }}>Saturation</b> (the <code>f·(k1+1)/(f+…)</code> shape) means the 5th <i>&quot;wireless&quot;</i> in a title doesn&apos;t count 5× the first — term frequency has diminishing returns, so keyword-stuffed titles can&apos;t dominate. Together they rank the <i>right</i> title first, not the longest or the most repetitive.
      </div>
    </div>
  );
}
