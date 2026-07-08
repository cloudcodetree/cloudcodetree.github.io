'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of an AI cost dashboard for an electronics deal-finder:
 * spend attributed per model (gpt-4o for extraction, gpt-4o-mini for deal scoring,
 * fastembed for title embeddings), and a budget bar that turns amber as it nears
 * the limit. Segments and the budget fill grow on view. Static-safe.
 *
 * Numbers reflect real CostTracker output from dealfinder/ops.py:
 *   record('gpt-4o-mini', 1000, 500)  => $0.00045
 *   record('gpt-4o', 1000, 0)         => $0.0025
 * Scaled to a realistic daily-traffic illustration; rates from PRICES dict.
 */

const SPEND = [
  { model: 'gpt-4o', cost: 62, color: '#f0883e', note: 'extraction' },
  { model: 'gpt-4o-mini', cost: 21, color: '#3fb950', note: 'deal scoring' },
  { model: 'fastembed', cost: 5, color: '#2f81f7', note: 'title embeddings' },
];
const TOTAL = SPEND.reduce((s, x) => s + x.cost, 0); // 88
const BUDGET = 100;

export default function CostDashboard({ accent = ACCENT }: { accent?: string }) {
  const frac = TOTAL / BUDGET;
  const warn = frac >= 0.8;
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        Spend by model — DealFinder FinOps view
      </div>

      {/* cost by model */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {SPEND.map((s, i) => (
          <div key={s.model} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', width: 96, flex: '0 0 auto' }}>{s.model}</span>
            <div style={{ flex: 1, height: 14, background: 'rgba(148,163,184,0.07)', borderRadius: 4, overflow: 'hidden', maxWidth: 300 }}>
              <motion.div
                style={{ height: '100%', borderRadius: 4, background: s.color }}
                initial={{ width: 0 }} whileInView={{ width: `${(s.cost / TOTAL) * 100}%` }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }}
              />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', width: 44, textAlign: 'right' }}>${s.cost}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: '#6b7683' }}>{s.note}</span>
          </div>
        ))}
      </div>

      {/* budget bar */}
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 5 }}>today vs ${BUDGET} daily budget</div>
      <div style={{ position: 'relative', height: 20, background: 'rgba(148,163,184,0.07)', borderRadius: 5, overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 5, background: warn ? '#d29922' : '#3fb950' }}
          initial={{ width: 0 }} whileInView={{ width: `${frac * 100}%` }} viewport={{ amount: 0.4 }} transition={{ delay: 0.5, duration: 0.8 }}
        />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '80%', width: 2, background: '#f85149' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: MONO, fontSize: 11 }}>
        <span style={{ color: '#cdd7e2' }}>${TOTAL} spent — budget_status: &quot;warn&quot;</span>
        {warn && <motion.span style={{ color: '#d29922' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>88% of budget — alert fired</motion.span>}
      </div>
    </div>
  );
}
