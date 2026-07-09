'use client';

import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the ReAct agent loop applied to deal-finding:
 * Reason → Act (tool call) → Observe → repeat, with a HITL hexagon gate
 * and a final answer node. Electronics domain example: noise-cancelling
 * headphones under $100 — Anker surfaces (DEAL); Bose demoted (SUSPICIOUS).
 * Static-export-safe. No runtime data fetch.
 */

const W = 520, H = 330;

// Core ReAct nodes (left column)
const REASON  = { x: 100, y: 70 };
const ACT     = { x: 100, y: 170 };
const OBSERVE = { x: 100, y: 270 };

// HITL hexagon (right side, mid-height)
const HITL = { x: 360, y: 185 };

// Final answer (bottom-right)
const ANSWER = { x: 430, y: 290 };

// Badge colours
const DEAL_CLR       = '#3fb950';  // green
const SUSPICIOUS_CLR = '#d29922';  // amber

function Hex({ cx, cy, r, stroke, fill }: { cx: number; cy: number; r: number; stroke: string; fill: string }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="1.5" />;
}

export default function AgentLoop({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
        ReAct agent loop — noise-cancelling headphones under $100
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 560, height: 'auto', display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="al-ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#8b98a8" />
          </marker>
          <marker id="al-ah-accent" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={accent} />
          </marker>
          <marker id="al-ah-suspicious" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={SUSPICIOUS_CLR} />
          </marker>
          <marker id="al-ah-deal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={DEAL_CLR} />
          </marker>
        </defs>

        {/* ── vertical ReAct spine ─────────────────────────────────── */}
        {/* Reason → Act */}
        <line x1={REASON.x} y1={REASON.y + 28} x2={ACT.x} y2={ACT.y - 28} stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#al-ah)" opacity="0.6" />
        {/* Act → Observe */}
        <line x1={ACT.x} y1={ACT.y + 28} x2={OBSERVE.x} y2={OBSERVE.y - 28} stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#al-ah)" opacity="0.6" />
        {/* Observe → back up to Reason (left loop) */}
        <path d={`M${OBSERVE.x - 28},${OBSERVE.y} Q 28,${(OBSERVE.y + REASON.y) / 2} ${REASON.x - 28},${REASON.y}`} fill="none" stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#al-ah)" opacity="0.4" strokeDasharray="4 3" />
        {/* loop label */}
        <text x="14" y={(OBSERVE.y + REASON.y) / 2 + 4} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#8b98a8" opacity="0.7">loop</text>

        {/* ── Act → HITL gate (suspicious badge path) ─────────────── */}
        <path d={`M${ACT.x + 30},${ACT.y} Q 230,${ACT.y} ${HITL.x - 38},${HITL.y}`} fill="none" stroke={SUSPICIOUS_CLR} strokeWidth="1.5" markerEnd="url(#al-ah-suspicious)" opacity="0.8" />
        <text x="220" y={ACT.y - 8} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8.5" fill={SUSPICIOUS_CLR}>Bose badge: SUSPICIOUS</text>
        <text x="220" y={ACT.y + 4} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#8b98a8">resid_frac 0.839</text>

        {/* ── HITL "no" → OBSERVE (item excluded) ─────────────────── */}
        <path d={`M${HITL.x - 10},${HITL.y + 38} Q ${HITL.x - 60},${HITL.y + 70} ${OBSERVE.x + 30},${OBSERVE.y}`} fill="none" stroke={SUSPICIOUS_CLR} strokeWidth="1.2" markerEnd="url(#al-ah-suspicious)" opacity="0.6" strokeDasharray="3 3" />
        <text x="255" y={OBSERVE.y + 26} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill={SUSPICIOUS_CLR}>user: no → excluded</text>

        {/* ── Observe → ANSWER (Anker surfaces) ───────────────────── */}
        <path d={`M${OBSERVE.x + 30},${OBSERVE.y + 14} Q ${(OBSERVE.x + ANSWER.x) / 2},${OBSERVE.y + 60} ${ANSWER.x - 36},${ANSWER.y}`} fill="none" stroke={DEAL_CLR} strokeWidth="1.5" markerEnd="url(#al-ah-deal)" opacity="0.85" />

        {/* ── Reason node ─────────────────────────────────────────── */}
        <g style={{ opacity: 0.6, animation: 'al-pulse 3.2s 0s infinite' }}>
          <circle cx={REASON.x} cy={REASON.y} r="26" fill={`${accent}14`} stroke={`${accent}80`} strokeWidth="1.5" />
          <text x={REASON.x} y={REASON.y - 5} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="10" fontWeight="700" fill="#fff">Reason</text>
          <text x={REASON.x} y={REASON.y + 8} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#8b98a8">query &lt;$100</text>
          <text x={REASON.x} y={REASON.y + 18} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#8b98a8">text_to_sql →</text>
        </g>

        {/* ── Act node ────────────────────────────────────────────── */}
        <g style={{ opacity: 0.6, animation: 'al-pulse 3.2s 1s infinite' }}>
          <circle cx={ACT.x} cy={ACT.y} r="26" fill={`${accent}14`} stroke={`${accent}80`} strokeWidth="1.5" />
          <text x={ACT.x} y={ACT.y - 5} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="10" fontWeight="700" fill="#fff">Act</text>
          <text x={ACT.x} y={ACT.y + 8} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#8b98a8">score_deal()</text>
          <text x={ACT.x} y={ACT.y + 18} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#8b98a8">2 rows → badges</text>
        </g>

        {/* ── Observe node ─────────────────────────────────────────── */}
        <g style={{ opacity: 0.6, animation: 'al-pulse 3.2s 2s infinite' }}>
          <circle cx={OBSERVE.x} cy={OBSERVE.y} r="26" fill={`${accent}14`} stroke={`${accent}80`} strokeWidth="1.5" />
          <text x={OBSERVE.x} y={OBSERVE.y - 5} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="10" fontWeight="700" fill="#fff">Observe</text>
          <text x={OBSERVE.x} y={OBSERVE.y + 8} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#8b98a8">Anker: DEAL</text>
          <text x={OBSERVE.x} y={OBSERVE.y + 18} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill={DEAL_CLR}>→ answer</text>
        </g>

        {/* ── HITL hexagon (distinct shape — unique to this part) ─── */}
        <g style={{ opacity: 0.7, animation: 'al-pulse7 2.4s 1.4s infinite' }}>
          <Hex cx={HITL.x} cy={HITL.y} r={36} stroke={SUSPICIOUS_CLR} fill={`${SUSPICIOUS_CLR}12`} />
          <text x={HITL.x} y={HITL.y - 12} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="9" fontWeight="700" fill={SUSPICIOUS_CLR}>ask_human</text>
          <text x={HITL.x} y={HITL.y + 2} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#fff">Bose at $46</text>
          <text x={HITL.x} y={HITL.y + 14} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#fff">SUSPICIOUS — ok?</text>
          <text x={HITL.x} y={HITL.y + 26} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill={SUSPICIOUS_CLR}>→ "no"</text>
        </g>

        {/* ── Answer node (rounded rect, green) ───────────────────── */}
        <rect x={ANSWER.x - 74} y={ANSWER.y - 22} width="148" height="44" rx="8" fill={`${DEAL_CLR}14`} stroke={`${DEAL_CLR}80`} strokeWidth="1.5" />
        <text x={ANSWER.x} y={ANSWER.y - 6} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="9" fontWeight="700" fill={DEAL_CLR}>Anker Q20i — $44.99</text>
        <text x={ANSWER.x} y={ANSWER.y + 7} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#fff">badge: DEAL  resid_frac 0.585</text>
        <text x={ANSWER.x} y={ANSWER.y + 18} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill={SUSPICIOUS_CLR}>Bose excluded (SUSPICIOUS)</text>

        {/* circulating token — CSS transform animation (static markup, hydration-safe) */}
        <circle cx={REASON.x} cy={REASON.y} r="5" fill={accent} style={{ animation: 'al-orbit 3.2s ease-in-out infinite' }} />
      </svg>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 8, textAlign: 'center' }}>
        The hexagon is the HITL gate — the only shape in this course that stops for a human before proceeding.
        Badge colors: DEAL (green) · FAIR (blue) · SUSPICIOUS (amber) · OVERPRICED (red).
      </div>
    </div>
  );
}
