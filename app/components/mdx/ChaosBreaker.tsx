'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke chaos/resilience visualization for Part 32.
 * Shows three live sources. One source goes down (turns red, gets benched by the
 * circuit breaker after COOLDOWN_SECONDS = 90s). Two healthy sources continue to
 * serve, cheapest-first. If ALL go down the output shows the well-formed empty
 * envelope, not a 500. Distinct metaphor: a "breaker panel" with live current
 * flowing through healthy sources, a tripped breaker on the failing one.
 * Static-safe (no runtime data fetch). Framer Motion only.
 */

type SourceState = 'healthy' | 'failing' | 'benched' | 'recovering';

const SOURCES: { id: string; name: string; tier: number }[] = [
  { id: 'rapidapi', name: 'RapidAPI', tier: 1 },
  { id: 'apify',    name: 'Apify',    tier: 2 },
  { id: 'firecrawl',name: 'Firecrawl',tier: 3 },
];

const COL: Record<SourceState, string> = {
  healthy:    '#3fb950',
  failing:    '#f85149',
  benched:    '#d29922',
  recovering: '#2f81f7',
};

const LABEL: Record<SourceState, string> = {
  healthy:    'serving · CLOSED',
  failing:    'error',
  benched:    'benched · OPEN · 90s',
  recovering: 'trial call · HALF-OPEN',
};

type Phase = 'all-healthy' | 'one-fails' | 'breaker-trips' | 'all-down' | 'recovering';

const PHASES: { phase: Phase; durationMs: number; states: SourceState[] }[] = [
  { phase: 'all-healthy',   durationMs: 1800, states: ['healthy', 'healthy', 'healthy'] },
  { phase: 'one-fails',     durationMs: 900,  states: ['failing', 'healthy', 'healthy'] },
  { phase: 'breaker-trips', durationMs: 2400, states: ['benched', 'healthy', 'healthy'] },
  { phase: 'all-down',      durationMs: 1800, states: ['benched', 'failing', 'benched'] },
  { phase: 'recovering',    durationMs: 1800, states: ['recovering', 'healthy', 'healthy'] },
];

const RESULTS: Record<Phase, { text: string; good: boolean }> = {
  'all-healthy':   { text: 'results: cheapest-first · count 12',           good: true  },
  'one-fails':     { text: 'RapidAPI errored — retrying via tier-2 …',     good: true  },
  'breaker-trips': { text: 'results: 2 sources · count 8 · throttled:[rapidapi]', good: true },
  'all-down':      { text: '{"count":0,"results":[],"median_price":0.0,"throttled":[…]}', good: false },
  'recovering':    { text: 'results: 2 sources · count 9 · recovering',    good: true  },
};

export default function ChaosBreaker({ accent = ACCENT }: { accent?: string }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      i = (i + 1) % PHASES.length;
      setPhaseIdx(i);
    };
    let id: ReturnType<typeof setTimeout>;
    const schedule = (idx: number) => {
      id = setTimeout(() => { tick(); schedule((idx + 1) % PHASES.length); }, PHASES[idx].durationMs);
    };
    schedule(0);
    return () => clearTimeout(id);
  }, []);

  const current = PHASES[phaseIdx];
  const result  = RESULTS[current.phase];

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)', overflowX: 'auto' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Circuit breaker — COOLDOWN_SECONDS = 90
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        A failing source is benched. Healthy sources keep serving. All down → empty envelope, never a 500.
      </div>

      {/* Source breaker panel */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {SOURCES.map((src, i) => {
          const state = current.states[i];
          const col   = COL[state];
          return (
            <motion.div
              key={src.id}
              animate={{ borderColor: col + '99', background: col + '12' }}
              transition={{ duration: 0.35 }}
              style={{
                flex: '1 1 120px', minWidth: 110,
                border: `1px solid ${col}99`,
                background: col + '12',
                borderRadius: 10, padding: '10px 12px',
              }}
            >
              {/* Breaker indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <motion.div
                  animate={{ backgroundColor: col }}
                  transition={{ duration: 0.35 }}
                  style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0 }}
                />
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#e6edf3' }}>{src.name}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginBottom: 4 }}>tier {src.tier}</div>
              <motion.div
                animate={{ color: col }}
                transition={{ duration: 0.35 }}
                style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600 }}
              >
                {LABEL[state]}
              </motion.div>
              {/* Animated current-flow bar on healthy/recovering */}
              {(state === 'healthy' || state === 'recovering') && (
                <motion.div
                  style={{ marginTop: 7, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${col}00, ${col}, ${col}00)`, backgroundSize: '200%' }}
                  animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' as const }}
                />
              )}
              {state === 'benched' && (
                <div style={{ marginTop: 7, height: 3, borderRadius: 2, background: '#d2992244' }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Output envelope */}
      <motion.div
        key={current.phase}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          borderRadius: 8,
          border: `1px solid ${result.good ? accent + '44' : '#f8514944'}`,
          background: result.good ? accent + '0a' : '#f851490a',
          padding: '10px 14px',
          fontFamily: MONO,
          fontSize: 11,
          color: result.good ? '#cdd7e2' : '#f85149',
        }}
      >
        <span style={{ color: result.good ? accent : '#f85149', fontWeight: 700, marginRight: 8 }}>
          {result.good ? 'GET /search →' : 'GET /search →'}
        </span>
        {result.text}
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 12, lineHeight: 1.6 }}>
        These are the circuit breaker&apos;s three canonical states. <b style={{ color: COL.healthy }}>CLOSED</b>: requests flow through normally (the breaker only counts failures). <b style={{ color: COL.benched }}>OPEN</b>: after the trip, calls to that source are skipped <i>instantly</i> for the cooldown — no request, no waiting on a dead upstream. <b style={{ color: COL.recovering }}>HALF-OPEN</b>: when the cooldown expires, exactly one trial call goes through — success re-closes the breaker, failure re-opens it for another 90s. The names describe an electrical circuit: closed = current flows, open = the circuit is cut.
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 10 }}>
        tests/test_chaos.py — 5/5 passed offline · COOLDOWN_SECONDS = 90.0 (pinned)
      </div>
    </div>
  );
}
