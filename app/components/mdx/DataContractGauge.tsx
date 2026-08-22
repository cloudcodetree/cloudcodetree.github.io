'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * DataContractGauge — bespoke animation for Part 16 (Pipelines & orchestration).
 *
 * Metaphor: a "contract meter" showing three scenarios side by side:
 *   1. Real snapshot — 270/270 rows pass, gate_passed=True (green bar, full).
 *   2. One bad row injected — 269/270 valid, gate raises DataContractError (amber).
 *   3. Missing column — 0/270 rows get past the required-columns check (red).
 *
 * The visual teaches the "stop-the-pipeline" seam: the gate is either a green
 * pass (the flow continues) or a hard DataContractError (the flow fails loud).
 * Teaching the fail path matters as much as the success path.
 *
 * All numbers are grounded: the real snapshot always produces 270/270 valid.
 * The bad-row and missing-column scenarios are illustrative (labeled as such).
 * Static-export-safe; no runtime data fetch.
 */

type Scenario = {
  label: string;
  total: number;
  valid: number;
  outcome: 'pass' | 'error' | 'fail';
  errorName?: string;
  note: string;
  anchored: boolean;
};

const SCENARIOS: Scenario[] = [
  {
    label: 'real snapshot',
    total: 270,
    valid: 270,
    outcome: 'pass',
    note: 'gate_passed=True · flow continues',
    anchored: true,
  },
  {
    label: 'one bad row (price=-1)',
    total: 270,
    valid: 269,
    outcome: 'error',
    errorName: 'DataContractError',
    note: '269/270 valid · flow fails',
    anchored: false,
  },
  {
    label: 'missing "category" col',
    total: 270,
    valid: 0,
    outcome: 'fail',
    errorName: 'DataContractError',
    note: '0/270 · required column absent',
    anchored: false,
  },
];

const OUTCOME_COLORS = {
  pass: { bar: ACCENT, border: 'rgba(148,188,227,0.35)', bg: 'rgba(148,188,227,0.08)', label: '#94bce3' },
  error: { bar: '#d29922', border: 'rgba(210,153,34,0.35)', bg: 'rgba(210,153,34,0.08)', label: '#d29922' },
  fail: { bar: '#f85149', border: 'rgba(248,81,73,0.35)', bg: 'rgba(248,81,73,0.08)', label: '#f85149' },
};

function ScenarioCard({ sc, i }: { sc: Scenario; i: number }) {
  const pct = sc.total > 0 ? sc.valid / sc.total : 0;
  const c = OUTCOME_COLORS[sc.outcome];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.2 }}
      transition={{ delay: 0.1 + i * 0.18, duration: 0.35 }}
      style={{
        flex: '1 1 160px',
        minWidth: 140,
        padding: '12px 12px 10px',
        borderRadius: 10,
        border: `1px solid ${c.border}`,
        background: c.bg,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Scenario label + anchored badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: c.label, flex: 1 }}>
          {sc.label}
        </div>
        {!sc.anchored && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 8,
              color: 'rgba(148,163,184,0.6)',
              border: '1px solid rgba(148,163,184,0.18)',
              borderRadius: 3,
              padding: '1px 4px',
              whiteSpace: 'nowrap' as const,
            }}
          >
            illustrative
          </span>
        )}
        {sc.anchored && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 8,
              color: ACCENT,
              border: `1px solid rgba(148,188,227,0.25)`,
              borderRadius: 3,
              padding: '1px 4px',
              whiteSpace: 'nowrap' as const,
            }}
          >
            anchored
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: 'rgba(148,163,184,0.10)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct * 100}%` }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: 0.35 + i * 0.18, duration: 0.55, ease: 'easeOut' as const }}
          style={{ height: '100%', background: c.bar, borderRadius: 4 }}
        />
      </div>

      {/* Fraction */}
      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: c.label }}>
        {sc.valid}/{sc.total} valid
      </div>

      {/* Error name */}
      {sc.errorName && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: c.label,
            background: `${c.bg}`,
            border: `1px solid ${c.border}`,
            borderRadius: 4,
            padding: '2px 6px',
            display: 'inline-block',
            alignSelf: 'flex-start',
          }}
        >
          raises {sc.errorName}
        </div>
      )}

      {/* Note */}
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(148,163,184,0.65)', lineHeight: 1.4 }}>
        {sc.note}
      </div>
    </motion.div>
  );
}

export default function DataContractGauge() {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '18px 16px',
        margin: '24px 0',
        background: 'rgba(13,17,23,0.4)',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: ACCENT,
          marginBottom: 3,
        }}
      >
        data contract gate — three scenarios
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 16 }}>
        validate_contract() → quality_gate() → DataContractError or proceed
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {SCENARIOS.map((sc, i) => (
          <ScenarioCard key={sc.label} sc={sc} i={i} />
        ))}
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: '#8b98a8',
          marginTop: 14,
          lineHeight: 1.6,
          borderTop: '1px solid rgba(148,163,184,0.10)',
          paddingTop: 10,
        }}
      >
        The gate has one job: stop the pipeline before bad rows reach the model.
        The real snapshot always passes (270/270). The illustrative scenarios show
        the two error modes: a bad field value and a missing required column.
      </div>
    </div>
  );
}
