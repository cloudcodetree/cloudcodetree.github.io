'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * PipelineDAG — bespoke animation for Part 16 (Pipelines & orchestration).
 *
 * Metaphor: a horizontal directed acyclic graph of the five pipeline stages,
 * with each stage node showing its Prefect task metadata (retries, cache).
 * The Anker Soundcore Q20i rides through as the worked example: you watch
 * `brand="Kohl's"` (the retailer) in the ingest node become
 * `true_brand="Soundcore"` after normalize, then pass the contract gate, then
 * receive the "deal" verdict.
 *
 * All numbers are real (ground-truth Part 16 execution). Static-export-safe.
 */

type Stage = {
  id: string;
  label: string;
  sublabel: string;
  meta: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

const STAGES: Stage[] = [
  {
    id: 'ingest',
    label: 'ingest',
    sublabel: 'load snapshot',
    meta: 'retries=2',
    color: '#2f81f7',
    bgColor: 'rgba(47,129,247,0.08)',
    borderColor: 'rgba(47,129,247,0.30)',
  },
  {
    id: 'normalize',
    label: 'normalize',
    sublabel: 'title_brand()',
    meta: 'cached',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.08)',
    borderColor: 'rgba(139,92,246,0.30)',
  },
  {
    id: 'gate',
    label: 'quality-gate',
    sublabel: 'contract check',
    meta: 'NO_CACHE',
    color: '#d29922',
    bgColor: 'rgba(210,153,34,0.08)',
    borderColor: 'rgba(210,153,34,0.35)',
  },
  {
    id: 'label',
    label: 'label',
    sublabel: 'two-signal verdict',
    meta: 'NO_CACHE',
    color: '#3fb950',
    bgColor: 'rgba(63,185,80,0.08)',
    borderColor: 'rgba(63,185,80,0.30)',
  },
  {
    id: 'model',
    label: 'good_deals',
    sublabel: 'dbt-style SQL',
    meta: 'cached',
    color: ACCENT,
    bgColor: 'rgba(63,185,80,0.10)',
    borderColor: `rgba(63,185,80,0.45)`,
  },
];

// Hero example row transformation through each stage
const HERO_STATES = [
  'brand="Kohl\'s"  price=44.99',
  'true_brand="Soundcore"   price=44.99',
  '270/270 valid · passed',
  'verdict=deal · score≈0.72',
  'median_deal_pct=0.724 ✓',
];

function StageNode({ stage, i }: { stage: Stage; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.2 }}
      transition={{ delay: 0.08 + i * 0.13, duration: 0.35 }}
      style={{
        flex: '1 1 0',
        minWidth: 0,
        padding: '10px 10px 8px',
        borderRadius: 10,
        border: `1px solid ${stage.borderColor}`,
        background: stage.bgColor,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: stage.color }}>
        {stage.label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
        {stage.sublabel}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color: stage.color,
          background: `${stage.bgColor}`,
          border: `1px solid ${stage.borderColor}`,
          borderRadius: 4,
          padding: '2px 5px',
          display: 'inline-block',
          marginTop: 2,
          alignSelf: 'flex-start',
        }}
      >
        {stage.meta}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.2 }}
        transition={{ delay: 0.5 + i * 0.13, duration: 0.3 }}
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color: 'rgba(148,163,184,0.7)',
          marginTop: 6,
          lineHeight: 1.4,
          borderTop: '1px solid rgba(148,163,184,0.10)',
          paddingTop: 5,
        }}
      >
        {HERO_STATES[i]}
      </motion.div>
    </motion.div>
  );
}

function Arrow({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ amount: 0.2 }}
      transition={{ delay: 0.22 + i * 0.13, duration: 0.22 }}
      style={{
        originX: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: 18,
        color: 'rgba(148,163,184,0.35)',
        fontFamily: MONO,
        fontSize: 14,
        fontWeight: 300,
        paddingBottom: 20,
      }}
    >
      →
    </motion.div>
  );
}

export default function PipelineDAG() {
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
        snapshot_flow — dealfinder-snapshot (Prefect 3.7.7)
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 16 }}>
        Anker Soundcore Q20i ($44.99) through the DAG — real executed output
      </div>

      {/* Stage nodes + arrows */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto' }}>
        {STAGES.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STAGES.length - 1 ? '1 1 0' : '1 1 0' }}>
            <StageNode stage={stage} i={i} />
            {i < STAGES.length - 1 && <Arrow i={i} />}
          </div>
        ))}
      </div>

      {/* Summary row */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.3 }}
        transition={{ delay: 1.0 }}
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid rgba(148,163,184,0.10)',
        }}
      >
        {[
          { label: 'ingested', value: '270' },
          { label: 'contract', value: '270/270 ✓' },
          { label: 'labeled', value: '270' },
          { label: 'deal', value: '71' },
          { label: 'good_deals', value: '111 rows' },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' as const }}>
            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: ACCENT }}>{value}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', letterSpacing: '0.06em' }}>{label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
