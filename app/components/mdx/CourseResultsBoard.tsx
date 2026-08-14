'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke capstone illustration: the 33-part DealFinder course, one results table.
 * Each row is a headline metric from the frozen snapshot / companion test suite —
 * every number is a real, course-pinned figure (§9 of the regen-spec, wave9-ground-truth).
 *
 * Visual metaphor: a CI dashboard / scoreboard — rows reveal in sequence,
 * the PASS/PROMOTE chips animate in last. Not a scatter, not a bar chart;
 * it looks like `pytest --tb=short` output but in design language.
 *
 * Static-safe: all values are real text in the DOM. No runtime fetch.
 */

type Row = {
  phase: string;       // Phase label (groups)
  metric: string;      // What is being measured
  value: string;       // The real pinned number
  status: 'pass' | 'promote' | 'anchored' | 'info';
  part: string;        // Part(s) that pin this metric
};

const ROWS: Row[] = [
  // Phase 1 — Data
  { phase: 'Data layer',    metric: 'Snapshot size',               value: '270 items · 18 queries · 11 categories', status: 'pass',     part: '1'    },
  { phase: 'Data layer',    metric: 'Retailer-polluted brand rows', value: '154 / 270',                              status: 'pass',     part: '1'    },
  { phase: 'Data layer',    metric: 'Anchor query median',          value: '$162.97 (noise cancelling headphones)', status: 'pass',     part: '3'    },
  { phase: 'Data layer',    metric: 'Dedup cosine threshold',       value: '0.90 course-wide',                       status: 'pass',     part: '1,9'  },

  // Phase 2/4 — ML
  { phase: 'ML & models',   metric: 'Linear MAE (baseline)',        value: '$227.89  R² 0.268',                      status: 'anchored', part: '17'   },
  { phase: 'ML & models',   metric: 'GBDT MAE (promoted)',          value: '$138.11  R² 0.727  −39.4% vs linear',   status: 'promote',  part: '17'   },
  { phase: 'ML & models',   metric: 'PyTorch MLP test MAE',         value: '$117.11',                                status: 'anchored', part: '17'   },
  { phase: 'ML & models',   metric: 'MLflow tracking winner',       value: 'GBDT  $138.11',                          status: 'pass',     part: '18'   },

  // Phase 4 — Eval & MLOps
  { phase: 'Eval & MLOps',  metric: 'precision@5  two-signal',      value: '1.00',                                   status: 'promote',  part: '19'   },
  { phase: 'Eval & MLOps',  metric: 'precision@5  median-only',     value: '0.40  (gate ≥ 0.80 → fail)',            status: 'pass',     part: '19'   },
  { phase: 'Eval & MLOps',  metric: 'PSI hold / retrain threshold', value: '0.043 hold · 0.318 → retrain',          status: 'pass',     part: '20'   },
  { phase: 'Eval & MLOps',  metric: 'MLOps promotion reason',       value: 'p@5=1.0 ≥ 0.8 · beat champion 0.4',    status: 'promote',  part: '20'   },

  // Phase 5 — Serving
  { phase: 'Serving',       metric: 'Semantic cache hit @0.95',     value: '0.429  (6/14)',                          status: 'pass',     part: '22'   },
  { phase: 'Serving',       metric: 'Semantic cache hit @0.90',     value: '0.500  (7/14) · near-dup cosine 0.9498', status: 'pass',    part: '22'   },

  // Phase 5 — Infra
  { phase: 'Infra',         metric: '/healthz load  p50 / rps',     value: '2.4ms  346 req/s  (anchored, local)',    status: 'anchored', part: '26,32'},
  { phase: 'Infra',         metric: '/search load  p50',            value: '10.1s (network-bound, anchored)',        status: 'anchored', part: '26,32'},
  { phase: 'Infra',         metric: 'Total tests passing',          value: '224 tests pass',                         status: 'pass',     part: '32'   },
  { phase: 'Infra',         metric: 'Playwright e2e',               value: '5 passed · 1 skipped (opt-in live)',    status: 'pass',     part: '32'   },

  // Phase 6 — SaaS
  { phase: 'Full-stack SaaS', metric: 'Frontend build',             value: 'React/Vite · 78 modules · clean',       status: 'pass',     part: '27'   },
  { phase: 'Full-stack SaaS', metric: 'Auth tests (Supabase JWT)',   value: '6 tests pass',                          status: 'pass',     part: '28'   },
  { phase: 'Full-stack SaaS', metric: 'Stripe plan gates',          value: 'free 25 · pro 1 000  8 tests pass',    status: 'pass',     part: '30'   },
  { phase: 'Full-stack SaaS', metric: 'Rate limiter (5-req window)', value: '[T,T,T,F,F]  verified',                status: 'pass',     part: '31'   },
];

const STATUS_COLOR: Record<string, string> = {
  pass:     '#3fb950',
  promote:  ACCENT,
  anchored: '#d29922',
  info:     '#8b98a8',
};
const STATUS_LABEL: Record<string, string> = {
  pass:     'PASS',
  promote:  'PROMOTE',
  anchored: 'ANCHORED',
  info:     'INFO',
};

// Group consecutive rows by phase
function groupRows(rows: Row[]): { phase: string; rows: Row[] }[] {
  const groups: { phase: string; rows: Row[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.phase === row.phase) {
      last.rows.push(row);
    } else {
      groups.push({ phase: row.phase, rows: [row] });
    }
  }
  return groups;
}

export default function CourseResultsBoard({ accent = ACCENT }: { accent?: string }) {
  const groups = groupRows(ROWS);
  let globalIndex = 0;

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.5)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Course results board · all 33 parts · real pinned figures
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        Every row is a companion test or anchored measurement — never invented.
      </div>

      {groups.map((g) => (
        <div key={g.phase} style={{ marginBottom: 16 }}>
          {/* Phase header */}
          <div style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: accent, borderBottom: `1px solid ${accent}30`, paddingBottom: 4, marginBottom: 6,
          }}>
            {g.phase}
          </div>

          {g.rows.map((row) => {
            const idx = globalIndex++;
            const color = STATUS_COLOR[row.status];
            return (
              <motion.div
                key={row.metric}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.2 }}
                transition={{ delay: 0.04 * idx, duration: 0.35 }}
              >
                {/* Status chip */}
                <motion.span
                  style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
                    color, border: `1px solid ${color}55`, borderRadius: 5,
                    padding: '2px 6px', flex: '0 0 auto', whiteSpace: 'nowrap',
                    background: `${color}12`,
                  }}
                  initial={{ scale: 0.7 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ amount: 0.2 }}
                  transition={{ delay: 0.04 * idx + 0.15, type: 'spring', stiffness: 300, damping: 18 }}
                >
                  {STATUS_LABEL[row.status]}
                </motion.span>

                {/* Metric name */}
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#cdd7e2', flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                  {row.metric}
                </span>

                {/* Value */}
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#8b98a8', flex: '1 1 auto' }}>
                  {row.value}
                </span>

                {/* Part badge */}
                <span style={{ fontFamily: MONO, fontSize: 9, color: accent, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                  p{row.part}
                </span>
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontFamily: MONO, fontSize: 10, color: '#8b98a8', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: 10 }}>
        {(['pass', 'promote', 'anchored'] as const).map((s) => (
          <span key={s}>
            <span style={{ color: STATUS_COLOR[s], fontWeight: 700 }}>{STATUS_LABEL[s]}</span>
            {s === 'pass'     && ' — companion test, reproducible offline'}
            {s === 'promote'  && ' — gate cleared, champion replaced'}
            {s === 'anchored' && ' — measured locally; re-run in your env'}
          </span>
        ))}
      </div>
    </div>
  );
}
