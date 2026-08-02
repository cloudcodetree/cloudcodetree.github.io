'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * CircuitStates — the circuit-breaker pattern itself (P9 aggregation, P36
 * chaos). The three-state machine as a diagram: CLOSED (requests flow), OPEN
 * (requests short-circuit instantly), HALF-OPEN (one probe decides). Distinct
 * shape from ChaosBreaker, which shows the *behavior over time*; this shows
 * the *machine*. Static SVG geometry + framer opacity = hydration-safe.
 */

const GREEN = '#3fb950';
const RED = '#f85149';
const AMBER = '#f0a30a';
const MUT = '#8b98a8';

function StateBox({ x, y, w, h, color, name, line1, line2 }: {
  x: number; y: number; w: number; h: number; color: string; name: string; line1: string; line2: string;
}) {
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={`${color}14`} stroke={color} strokeWidth="1.4" />
      <text x={cx} y={y + 15} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="10" fontWeight="700" fill={color}>{name}</text>
      <text x={cx} y={y + 28} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill="#cdd7e2">{line1}</text>
      <text x={cx} y={y + 39} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7.5" fill={MUT}>{line2}</text>
    </g>
  );
}

export default function CircuitStates({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        The circuit-breaker pattern — three states, four transitions
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginBottom: 12 }}>
        named after the electrical panel: closed circuit = current flows, open circuit = the line is cut
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }}>
        <svg viewBox="0 0 320 168" style={{ width: '100%', maxWidth: 560, height: 'auto', display: 'block' }}>
          <defs>
            <marker id="cs-arrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill={MUT} />
            </marker>
          </defs>

          <StateBox x={10} y={22} w={104} h={46} color={GREEN} name="CLOSED" line1="requests flow" line2="failures counted" />
          <StateBox x={206} y={22} w={104} h={46} color={RED} name="OPEN" line1="skip instantly" line2="no call attempted" />
          <StateBox x={108} y={112} w={104} h={46} color={AMBER} name="HALF-OPEN" line1="one probe call" line2="its result decides" />

          {/* CLOSED -> OPEN (top) */}
          <line x1={114} y1={38} x2={202} y2={38} stroke={MUT} strokeWidth="1.2" markerEnd="url(#cs-arrow)" />
          <text x={160} y={13} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={RED}>error budget exceeded</text>
          <text x={160} y={32} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="6.4" fill={MUT}>(DealFinder: 1 strike)</text>

          {/* OPEN -> HALF-OPEN */}
          <path d="M 258,68 C 258,100 224,108 216,116" fill="none" stroke={MUT} strokeWidth="1.2" markerEnd="url(#cs-arrow)" />
          <text x={272} y={98} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={AMBER}>cooldown elapses</text>
          <text x={272} y={108} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={MUT}>(90 s)</text>

          {/* HALF-OPEN -> CLOSED */}
          <path d="M 104,116 C 96,108 62,100 62,68" fill="none" stroke={GREEN} strokeWidth="1.2" markerEnd="url(#cs-arrow)" />
          <text x={46} y={98} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={GREEN}>probe succeeds</text>

          {/* HALF-OPEN -> OPEN (short return) */}
          <path d="M 212,142 C 288,142 296,96 288,70" fill="none" stroke={RED} strokeWidth="1.2" markerEnd="url(#cs-arrow)" />
          <text x={272} y={156} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={RED}>probe fails → re-open</text>
        </svg>
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 12, lineHeight: 1.6 }}>
        <b style={{ color: '#cdd7e2' }}>Why cut the circuit at all?</b> Because a <i>dead</i> dependency is worse than a missing one. Without a breaker, every request to a down source pays the full timeout — 12 searches against a hung upstream at a 20&nbsp;s timeout is four minutes of users staring at spinners, and a connection-pool slot burned per attempt. With one, only the <i>first</i> request pays; every request for the next 90&nbsp;s skips the source in microseconds and the rest of the results still come back. The <b style={{ color: AMBER }}>HALF-OPEN</b> probe is the other half of the trick: recovery is <i>tested with one request</i>, not a thundering herd — a barely-recovered upstream gets one call, not your entire backlog at once.
      </div>
    </div>
  );
}
