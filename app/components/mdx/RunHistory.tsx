'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for "offline & deterministic": determinism is only
 * visible as pass/fail CYCLES across runs, so this mirrors how CI dashboards
 * (Datadog, Atlassian) actually show flakiness — a run-history strip.
 *
 * Two lanes run the same connector test suite N times:
 *   - live RapidAPI → mixed results (quota hit, timeout, rate-limit 429) = can't trust red
 *   - snapshot (electronics-2026-07.json) → identical green every run = deterministic
 *
 * The contrast IS the lesson. Cells stamp in left→right on a loop. Static-safe:
 * the cells and verdicts are real text, so the point survives with no JS.
 * Electronics context: the suite tests the Google Shopping connector + normalizer.
 */

type Cell = { ok: boolean; note: string };

const LIVE: Cell[] = [
  { ok: true, note: '1.3s' },
  { ok: false, note: '429 quota' },
  { ok: true, note: '1.1s' },
  { ok: false, note: 'timeout' },
  { ok: true, note: '1.5s' },
];

const OFFLINE: Cell[] = Array.from({ length: 5 }, () => ({ ok: true, note: '270 items' }));

function Strip({ cells, accent }: { cells: Cell[]; accent: string }) {
  return (
    <motion.div
      style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
      initial="hidden"
      whileInView="show"
      viewport={{ amount: 0.5 }}
      variants={{ show: { transition: { staggerChildren: 0.18 } } }}
    >
      {cells.map((c, i) => {
        const col = c.ok ? accent : '#f85149';
        return (
          <motion.div
            key={i}
            variants={{ hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              border: `1px solid ${col}59`, background: `${col}14`, borderRadius: 8,
              padding: '6px 8px', minWidth: 54,
            }}
          >
            <span style={{ color: col, fontWeight: 700, fontSize: 13 }}>{c.ok ? '✓' : '✕'}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', whiteSpace: 'nowrap' }}>{c.note}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function Lane({
  tag, tagColor, cells, verdict, verdictColor, accent,
}: {
  tag: string; tagColor: string; cells: Cell[]; verdict: string; verdictColor: string; accent: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 130px', minWidth: 120 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: tagColor, fontWeight: 700 }}>{tag}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: verdictColor, marginTop: 2 }}>{verdict}</div>
      </div>
      <div style={{ flex: '1 1 280px' }}>
        <Strip cells={cells} accent={accent} />
      </div>
    </div>
  );
}

export default function RunHistory({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Connector test suite, five runs
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        determinism is only visible across runs — live APIs are not a stable test surface
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Lane
          tag="live RapidAPI"
          tagColor="#f85149"
          cells={LIVE}
          verdict="⚠ flaky — red ≠ real bug (quota / timeout)"
          verdictColor="#f85149"
          accent={accent}
        />
        <div style={{ height: 1, background: 'rgba(148,163,184,0.12)' }} />
        <Lane
          tag="snapshot (270 items)"
          tagColor={accent}
          cells={OFFLINE}
          verdict="✓ deterministic — identical every run"
          verdictColor={accent}
          accent={accent}
        />
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 18 }}>
        The snapshot is the stable test surface. Live connectors are tested separately, against mocked responses — so <span style={{ color: '#f85149' }}>quota errors</span> never mask <span style={{ color: accent }}>real normalizer bugs</span>.
      </div>
    </div>
  );
}
