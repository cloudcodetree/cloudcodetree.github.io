'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of tiered aggregation with early-stop.
 *
 * Three tiers flow top-to-bottom as nodes. An arrow exits each tier downward
 * toward the next — but when Tier 1 hits the early-stop threshold a bypass
 * arrow cuts directly to the "Done" terminal, skipping Tiers 2 and 3. When
 * a source is OPEN (circuit broken), its node goes red and the flow routes
 * around it to the next tier.
 *
 * The animation cycles between two scenarios:
 *   Phase A (0–3 s): Tier 1 succeeds → early-stop fires → Tiers 2/3 SKIPPED.
 *   Phase B (3–7 s): Tier 1 OPEN (circuit breaker) → traffic promoted to Tier 2.
 *
 * All node labels are real text in the DOM — static-export-safe.
 * Shape: a vertical linear chain (distinct from the circular AgentLoop).
 */

const W = 340, H = 420;

// node centres
const T1 = { x: 170, y: 72 };
const T2 = { x: 170, y: 198 };
const T3 = { x: 170, y: 324 };
const DONE = { x: 170, y: 396 };

const TIER_R = 38;

export default function TierWaterfall({ accent = ACCENT }: { accent?: string }) {
  const tiers = [
    { node: T1, label: 'Tier 1', sub: 'RapidAPI', tier: 1 },
    { node: T2, label: 'Tier 2', sub: 'Apify', tier: 2 },
    { node: T3, label: 'Tier 3', sub: 'Firecrawl', tier: 3 },
  ];

  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '20px 18px',
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
          color: accent,
          marginBottom: 8,
        }}
      >
        Tiered aggregation — early-stop &amp; circuit breaker
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto' }}
        aria-label="Tier waterfall diagram: three aggregation tiers with early-stop bypass and circuit-breaker rerouting"
      >
        <defs>
          <marker id="tw-ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#8b98a8" />
          </marker>
          <marker id="tw-ah-accent" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={accent} />
          </marker>
          <marker id="tw-ah-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#f85149" />
          </marker>
        </defs>

        {/* ── Normal downward flow arrows (T1→T2, T2→T3, T3→Done) ─────────────── */}
        {/* T1 → T2 */}
        <motion.line
          x1={T1.x} y1={T1.y + TIER_R + 2}
          x2={T2.x} y2={T2.y - TIER_R - 6}
          stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#tw-ah)"
          animate={{ opacity: [0.55, 0.55, 0.0, 0.55, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.38, 0.42, 0.48, 1], ease: 'linear' }}
        />
        {/* T2 → T3 */}
        <motion.line
          x1={T2.x} y1={T2.y + TIER_R + 2}
          x2={T3.x} y2={T3.y - TIER_R - 6}
          stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#tw-ah)"
          animate={{ opacity: [0.0, 0.0, 0.55, 0.55, 0.0] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.44, 0.50, 0.90, 1], ease: 'linear' }}
        />
        {/* T3 → Done */}
        <motion.line
          x1={T3.x} y1={T3.y + TIER_R + 2}
          x2={DONE.x} y2={DONE.y - 10}
          stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#tw-ah)"
          animate={{ opacity: [0, 0, 0, 0.55, 0] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.6, 0.64, 0.90, 1], ease: 'linear' }}
        />

        {/* ── Early-stop bypass: T1 → Done (dashed accent arc, right side) ──── */}
        <motion.path
          d={`M${T1.x + TIER_R - 4},${T1.y + 14} C ${W - 18},${T1.y + 30} ${W - 18},${DONE.y - 12} ${DONE.x + 26},${DONE.y - 2}`}
          fill="none"
          stroke={accent}
          strokeWidth="1.8"
          strokeDasharray="5 3"
          markerEnd="url(#tw-ah-accent)"
          animate={{ opacity: [0.0, 0.85, 0.85, 0.0, 0.0] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.10, 0.38, 0.42, 1], ease: 'linear' }}
        />

        {/* Early-stop label */}
        <motion.text
          x={W - 14} y={(T1.y + DONE.y) / 2}
          textAnchor="end"
          fontFamily="Menlo, monospace"
          fontSize="9"
          fill={accent}
          animate={{ opacity: [0.0, 0.9, 0.9, 0.0, 0.0] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.10, 0.38, 0.42, 1], ease: 'linear' }}
        >
          early-stop
        </motion.text>

        {/* ── Circuit-breaker scenario: T1 OPEN, traffic to T2 (left arc) ──── */}
        {/* Reroute arrow from T1-open → T2 */}
        <motion.path
          d={`M${T1.x - TIER_R + 4},${T1.y + 14} C 14,${T1.y + 50} 14,${T2.y - 40} ${T2.x - TIER_R + 4},${T2.y - 14}`}
          fill="none"
          stroke="#f85149"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          markerEnd="url(#tw-ah-red)"
          animate={{ opacity: [0.0, 0.0, 0.0, 0.80, 0.80, 0.0] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.42, 0.48, 0.54, 0.96, 1], ease: 'linear' }}
        />

        {/* OPEN label next to T1 when circuit broken */}
        <motion.text
          x={T1.x - TIER_R - 4} y={T1.y - 8}
          textAnchor="end"
          fontFamily="Menlo, monospace"
          fontSize="9"
          fill="#f85149"
          animate={{ opacity: [0.0, 0.0, 0.0, 0.95, 0.95, 0.0] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.42, 0.48, 0.54, 0.96, 1], ease: 'linear' }}
        >
          OPEN
        </motion.text>

        {/* ── Tier nodes ───────────────────────────────────────────────────── */}
        {tiers.map(({ node, label, sub, tier }) => {
          const breakerOpen = tier === 1;
          return (
            <g key={label}>
              {/* normal state */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={TIER_R}
                fill={`${accent}12`}
                stroke={`${accent}66`}
                strokeWidth="1.5"
                animate={
                  breakerOpen
                    ? { fill: [`${accent}12`, `${accent}12`, '#f8514920', '#f8514920', `${accent}12`] }
                    : {}
                }
                transition={
                  breakerOpen
                    ? { duration: 7, repeat: Infinity, times: [0, 0.42, 0.54, 0.96, 1], ease: 'linear' }
                    : {}
                }
              />
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={TIER_R}
                fill="none"
                stroke={
                  breakerOpen ? '#f85149' : `${accent}66`
                }
                strokeWidth={breakerOpen ? 2 : 1.5}
                animate={
                  breakerOpen
                    ? { opacity: [0, 0, 1, 1, 0] }
                    : { opacity: 0 }
                }
                transition={
                  breakerOpen
                    ? { duration: 7, repeat: Infinity, times: [0, 0.42, 0.54, 0.96, 1], ease: 'linear' }
                    : {}
                }
              />
              <text
                x={node.x}
                y={node.y - 5}
                textAnchor="middle"
                fontFamily="Menlo, monospace"
                fontSize="12"
                fontWeight="700"
                fill="#fff"
              >
                {label}
              </text>
              <text
                x={node.x}
                y={node.y + 10}
                textAnchor="middle"
                fontFamily="Menlo, monospace"
                fontSize="9"
                fill="#8b98a8"
              >
                {sub}
              </text>
              {/* SKIPPED stamp — appears on T2 + T3 during early-stop phase */}
              {(tier === 2 || tier === 3) && (
                <motion.text
                  x={node.x}
                  y={node.y + 25}
                  textAnchor="middle"
                  fontFamily="Menlo, monospace"
                  fontSize="9"
                  fill="#8b98a8"
                  animate={{ opacity: [0, 0.85, 0.85, 0, 0] }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    times: [0, 0.10, 0.38, 0.42, 1],
                    ease: 'linear',
                  }}
                >
                  SKIPPED
                </motion.text>
              )}
            </g>
          );
        })}

        {/* ── Done terminal ─────────────────────────────────────────────────── */}
        <motion.rect
          x={DONE.x - 44}
          y={DONE.y - 12}
          width={88}
          height={24}
          rx={7}
          fill={`${accent}18`}
          stroke={`${accent}80`}
          strokeWidth="1.5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text
          x={DONE.x}
          y={DONE.y + 5}
          textAnchor="middle"
          fontFamily="Menlo, monospace"
          fontSize="11"
          fontWeight="700"
          fill={accent}
        >
          Done
        </text>

        {/* "results ≥ min_results" label inside the Done box — always visible */}
        <text
          x={DONE.x}
          y={DONE.y + 18}
          textAnchor="middle"
          fontFamily="Menlo, monospace"
          fontSize="8"
          fill="#8b98a8"
        >
          results ≥ min_results
        </text>
      </svg>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          marginTop: 10,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: accent }}>Early-stop (right arc):</span> Tier 1 fills
        min_results — Tiers 2 &amp; 3 never run.{' '}
        <span style={{ color: '#f85149' }}>Circuit open (left arc):</span> Tier 1 OPEN
        — traffic promoted to Tier 2.
      </div>
    </div>
  );
}
