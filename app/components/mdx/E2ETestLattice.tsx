'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke Playwright e2e visualization for Part 32.
 * Shows the two test files (search.spec.ts / live.spec.ts) as a vertical lattice
 * of test cases. Each test animates in with a green check (or amber "skipped" for
 * the opt-in live test). Badge tokens are shown inline as coloured chips matching
 * the §9.7 taxonomy. Distinct metaphor: a CI test run's log view.
 * Static-safe. No runtime fetch. Framer Motion only.
 */

const BADGE_COL: Record<string, string> = {
  DEAL:       '#94bce3',
  FAIR:       '#94bce3',
  SUSPICIOUS: '#d29922',
  OVERPRICED: '#8b98a8',
};

type TestRow = {
  name: string;
  file: string;
  status: 'pass' | 'skip';
  badges?: string[];
  note?: string;
};

const TESTS: TestRow[] = [
  {
    file: 'search.spec.ts',
    name: 'renders result cards, each carrying a §9 badge',
    status: 'pass',
    badges: ['DEAL','FAIR','SUSPICIOUS','OVERPRICED'],
  },
  {
    file: 'search.spec.ts',
    name: 'badge taxonomy is EXACTLY the four §9 tokens — no synonyms',
    status: 'pass',
    note: 'fixtures.ts BADGE_TOKENS closed set',
  },
  {
    file: 'search.spec.ts',
    name: 'a specific offer maps to the expected badge',
    status: 'pass',
    note: 'deal_pct 80→SUSPICIOUS  25→DEAL  0→FAIR  −30→OVERPRICED',
  },
  {
    file: 'search.spec.ts',
    name: 'empty query does not fire a search',
    status: 'pass',
    note: 'no network request on empty submit',
  },
  {
    file: 'search.spec.ts',
    name: 'a query with zero offers shows the empty state, not an error',
    status: 'pass',
    note: '/no offers found/i — not /search failed/i',
  },
  {
    file: 'live.spec.ts',
    name: 'real search renders cards with valid §9 badges',
    status: 'skip',
    note: 'E2E_LIVE=1 to enable  ·  baseURL :5173',
  },
];

export default function E2ETestLattice({ accent = ACCENT }: { accent?: string }) {
  const passed  = TESTS.filter((t) => t.status === 'pass').length;
  const skipped = TESTS.filter((t) => t.status === 'skip').length;

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      {/* Header */}
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Playwright e2e — frontend/e2e/
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>
        <span><span style={{ color: '#94bce3', fontWeight: 700 }}>{passed} passed</span></span>
        <span><span style={{ color: '#d29922', fontWeight: 700 }}>{skipped} skipped</span> (E2E_LIVE=1 gate)</span>
        <span style={{ marginLeft: 'auto', color: '#4a5568' }}>chromium · :5173</span>
      </div>

      {/* Test rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {TESTS.map((t, i) => {
          const isSkip  = t.status === 'skip';
          const dotCol  = isSkip ? '#d29922' : '#94bce3';
          const fileCol = t.file === 'live.spec.ts' ? '#d29922' : '#94bce3';
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.2, once: true }}
              transition={{ delay: i * 0.09 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '8px 10px',
                borderRadius: 8,
                background: isSkip ? 'rgba(210,153,34,0.04)' : 'rgba(148,188,227,0.04)',
                border: `1px solid ${isSkip ? '#d2992218' : '#94bce318'}`,
              }}
            >
              {/* Status dot */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ amount: 0.2, once: true }}
                transition={{ delay: 0.15 + i * 0.09, type: 'spring', stiffness: 300, damping: 18 }}
                style={{ width: 10, height: 10, borderRadius: '50%', background: dotCol, flexShrink: 0, marginTop: 3 }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* File badge */}
                <span style={{ fontFamily: MONO, fontSize: 9, color: fileCol, border: `1px solid ${fileCol}44`, borderRadius: 4, padding: '1px 6px', marginRight: 8, whiteSpace: 'nowrap' }}>
                  {t.file}
                </span>
                {/* Test name */}
                <span style={{ fontFamily: MONO, fontSize: 11, color: isSkip ? '#8b98a8' : '#cdd7e2' }}>
                  {t.name}
                </span>

                {/* Badge chips */}
                {t.badges && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                    {t.badges.map((b) => (
                      <span
                        key={b}
                        style={{
                          fontFamily: MONO, fontSize: 9, fontWeight: 700,
                          color: BADGE_COL[b], border: `1px solid ${BADGE_COL[b]}60`,
                          background: BADGE_COL[b] + '14',
                          borderRadius: 5, padding: '2px 7px',
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                {/* Note line */}
                {t.note && (
                  <div style={{ fontFamily: MONO, fontSize: 9, color: '#4a5568', marginTop: 3 }}>
                    {t.note}
                  </div>
                )}
              </div>

              {/* PASS / SKIP label */}
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: dotCol, whiteSpace: 'nowrap', marginTop: 2 }}>
                {isSkip ? 'skipped' : 'PASS'}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 14 }}>
        data-testid="result-card" · [data-badge] in &#123;DEAL,FAIR,SUSPICIOUS,OVERPRICED&#125; · hermetic: SSE abort → fetch fallback
      </div>
    </div>
  );
}
