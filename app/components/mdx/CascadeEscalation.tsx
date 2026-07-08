'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * CascadeEscalation — bespoke animation for Part 23 (Inference optimization).
 *
 * Metaphor: a waterfall / escalation ladder. Three scenarios play out left-to-right:
 * (1) cheap tier answers → short path, no escalation;
 * (2) cheap fails (429) → escalates to free tier;
 * (3) all tiers raise → RuntimeError.
 * Real logic from CascadeRouter in dealfinder/inference.py.
 * Tier order matches llm.models(): deepseek/deepseek-chat → meta-llama/llama-3.3-70b:free
 *
 * Static-safe. Escalation logic is MEASURED (injected transport, no network).
 */

type Scenario = {
  label: string;
  steps: Array<{ tier: string; result: 'hit' | 'fail' | 'escalate' | 'error'; note: string }>;
  outcome: string;
  outcomeColor: string;
};

const SCENARIOS: Scenario[] = [
  {
    label: 'Happy path',
    steps: [
      { tier: 'cheap (deepseek-chat)', result: 'hit', note: 'answers → serve' },
    ],
    outcome: 'served · escalated=False',
    outcomeColor: '#3fb950',
  },
  {
    label: '429 / failure',
    steps: [
      { tier: 'cheap (deepseek-chat)', result: 'fail', note: '429 raised → escalate' },
      { tier: 'free (llama-3.3-70b)',  result: 'hit',  note: 'answers → serve' },
    ],
    outcome: 'served · escalated=True',
    outcomeColor: '#d29922',
  },
  {
    label: 'All tiers fail',
    steps: [
      { tier: 'cheap (deepseek-chat)', result: 'fail',  note: 'raises' },
      { tier: 'free (llama-3.3-70b)',  result: 'error', note: 'down → exhausted' },
    ],
    outcome: 'RuntimeError: all tiers exhausted',
    outcomeColor: '#f85149',
  },
];

const RESULT_COLORS = {
  hit:      '#3fb950',
  fail:     '#d29922',
  escalate: '#2f81f7',
  error:    '#f85149',
};

const RESULT_LABELS = {
  hit:      'HIT',
  fail:     'FAIL',
  escalate: '↓',
  error:    'ERR',
};

export default function CascadeEscalation({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      {/* header */}
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        CascadeRouter · try cheapest first, escalate on failure or low confidence
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginBottom: 18 }}>
        measured logic · injected transport · no network · tier order: cheap paid → free fallback
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {SCENARIOS.map((scenario, si) => (
          <motion.div
            key={scenario.label}
            style={{ flex: '1 1 160px', minWidth: 150, border: '1px solid rgba(148,163,184,0.12)', borderRadius: 10, padding: '12px 14px', background: 'rgba(13,17,23,0.3)' }}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.4 }}
            transition={{ delay: 0.1 + si * 0.15 }}
          >
            {/* scenario label */}
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#cdd7e2', marginBottom: 10, fontWeight: 700 }}>
              {scenario.label}
            </div>

            {/* steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scenario.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -4 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ amount: 0.4 }}
                  transition={{ delay: 0.3 + si * 0.15 + idx * 0.12 }}
                >
                  {/* tier row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* result badge */}
                    <div style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      fontWeight: 700,
                      color: RESULT_COLORS[step.result],
                      border: `1px solid ${RESULT_COLORS[step.result]}50`,
                      borderRadius: 4,
                      padding: '1px 5px',
                      minWidth: 28,
                      textAlign: 'center',
                    }}>
                      {RESULT_LABELS[step.result]}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', flex: 1 }}>
                      {step.tier}
                    </div>
                  </div>
                  {/* note */}
                  <div style={{ fontFamily: MONO, fontSize: 8, color: '#5a6477', marginTop: 2, marginLeft: 34 }}>
                    {step.note}
                  </div>

                  {/* escalation arrow between steps */}
                  {idx < scenario.steps.length - 1 && (
                    <motion.div
                      style={{ marginLeft: 10, marginTop: 4, marginBottom: 2, fontFamily: MONO, fontSize: 10, color: '#2f81f7' }}
                      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.4 }}
                      transition={{ delay: 0.4 + si * 0.15 + idx * 0.12 }}
                    >
                      ↓ escalate
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* outcome */}
            <motion.div
              style={{
                marginTop: 10,
                fontFamily: MONO,
                fontSize: 9,
                color: scenario.outcomeColor,
                borderTop: `1px solid ${scenario.outcomeColor}30`,
                paddingTop: 8,
                fontWeight: 700,
              }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.4 }}
              transition={{ delay: 0.5 + si * 0.15 + scenario.steps.length * 0.12 }}
            >
              {scenario.outcome}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 14 }}>
        escalated = len(attempts) {'>'} 1 · low confidence ({'<'} min_confidence 0.5) also triggers escalation, same ladder
      </div>
    </div>
  );
}
