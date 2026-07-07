'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for "how this scales in production": the pipeline
 * skeleton (Source → Schedule → Throughput → Store) is the FIXED contract; each
 * stage's implementation upgrades from a dev impl to a production-grade one. The
 * stable skeleton + the contract spine carry the lesson ("interface unchanged"),
 * while a staggered "level-up" highlight sweeps each dev tile → prod tile.
 *
 * Both dev and prod labels stay visible — informative and static-safe (the real
 * swap targets read with no JS); the animation only adds emphasis.
 *
 * Electronics context: the dev path uses the frozen snapshot; the prod path uses
 * the live RapidAPI + Apify aggregator on a schedule, storing into pgvector.
 * The DealSource interface is the fixed contract at every stage.
 */

const STAGES = [
  { role: 'Source', dev: 'electronics-2026-07.json', prod: 'RapidAPI · Apify live' },
  { role: 'Schedule', dev: 'manual run', prod: 'Prefect · daily cron' },
  { role: 'Throughput', dev: 'in-process loop', prod: 'async batch + circuit breaker' },
  { role: 'Store', dev: 'dict + JSON', prod: 'Postgres · pgvector' },
];

function Stage({ s, i, accent }: { s: typeof STAGES[number]; i: number; accent: string }) {
  const tile = {
    borderRadius: 8,
    padding: '6px 9px',
    fontFamily: MONO,
    fontSize: 11,
    whiteSpace: 'nowrap' as const,
    border: '1px solid rgba(148,163,184,0.18)',
  };
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 5, flex: '1 1 130px', minWidth: 124 }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.4 }}
      transition={{ delay: i * 0.1, type: 'spring', stiffness: 240, damping: 24 }}
    >
      <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 1 }}>{s.role}</div>

      {/* prod tile (the scaled-up target) — glows in a left→right ripple */}
      <motion.div
        style={{ ...tile, borderColor: `${accent}73`, background: `${accent}12`, color: '#fff', textAlign: 'center' }}
        animate={{ boxShadow: [`0 0 0px ${accent}00`, `0 0 12px ${accent}66`, `0 0 0px ${accent}00`] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.45, ease: 'easeInOut' }}
      >
        <span style={{ color: accent, fontWeight: 700 }}>prod</span> · {s.prod}
      </motion.div>

      {/* level-up arrow dev → prod */}
      <motion.div
        style={{ textAlign: 'center', color: accent, fontSize: 13, lineHeight: 1 }}
        animate={{ y: [3, -3, 3], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.45, ease: 'easeInOut' }}
      >▲</motion.div>

      {/* dev tile (where the tutorial is now) */}
      <div style={{ ...tile, background: 'rgba(148,163,184,0.05)', color: '#cdd7e2', textAlign: 'center' }}>
        <span style={{ color: '#8b98a8', fontWeight: 700 }}>dev</span> · {s.dev}
      </div>
    </motion.div>
  );
}

export default function ScaleSwap({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)', overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>
          Same interface, production-grade parts
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>
          💻 dev <span style={{ color: accent }}>→</span> ☁️ production
        </div>
      </div>

      {/* fixed pipeline skeleton: stages joined by → arrows */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 540 }}>
        {STAGES.map((s, i) => (
          <div key={s.role} style={{ display: 'contents' }}>
            <Stage s={s} i={i} accent={accent} />
            {i < STAGES.length - 1 && (
              <motion.span
                style={{ fontFamily: MONO, fontSize: 16, color: '#8b98a8', flex: '0 0 auto' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              >→</motion.span>
            )}
          </div>
        ))}
      </div>

      {/* the contract that never changes */}
      <motion.div
        style={{ marginTop: 16, borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontFamily: MONO, fontSize: 11,
                 border: `1px dashed ${accent}59`, background: `${accent}08`, color: '#cdd7e2', minWidth: 540 }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span style={{ color: accent, fontWeight: 700 }}>DealSource interface</span> · normalize() · ingest() — unchanged at every stage; only the implementations swap
      </motion.div>
    </div>
  );
}
