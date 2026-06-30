'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the ReAct agent loop: Reason → Act (call a tool) →
 * Observe → back to Reason, until it answers. A token circulates the cycle and
 * each node pulses as it passes; the loop exits to an answer. Static-safe.
 */

const W = 380, H = 250;
const N = {
  reason: { x: 190, y: 48, label: 'Reason', sub: 'what next?' },
  act: { x: 312, y: 180, label: 'Act', sub: 'call a tool' },
  observe: { x: 68, y: 180, label: 'Observe', sub: 'read result' },
};

export default function AgentLoop({ accent = ACCENT }: { accent?: string }) {
  const order = [N.reason, N.act, N.observe];
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
        The agent loop (ReAct)
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, height: 'auto', display: 'block', margin: '0 auto' }}>
        <defs>
          <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#8b98a8" />
          </marker>
        </defs>
        {/* cycle arrows */}
        <path d={`M${N.reason.x + 20},${N.reason.y + 18} Q ${N.act.x + 20},${N.reason.y + 30} ${N.act.x + 6},${N.act.y - 22}`} fill="none" stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#ah)" opacity="0.6" />
        <path d={`M${N.act.x - 26},${N.act.y + 14} Q 190,${H - 12} ${N.observe.x + 26},${N.observe.y + 14}`} fill="none" stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#ah)" opacity="0.6" />
        <path d={`M${N.observe.x + 6},${N.observe.y - 22} Q ${N.reason.x - 70},${N.reason.y + 30} ${N.reason.x - 20},${N.reason.y + 18}`} fill="none" stroke="#8b98a8" strokeWidth="1.5" markerEnd="url(#ah)" opacity="0.6" />

        {/* circulating token */}
        <motion.circle
          r="6" fill={accent}
          animate={{ cx: [N.reason.x, N.act.x, N.observe.x, N.reason.x], cy: [N.reason.y, N.act.y, N.observe.y, N.reason.y] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.33, 0.66, 1] }}
        />

        {/* nodes */}
        {order.map((n, i) => (
          <motion.g key={n.label} animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 3.6, repeat: Infinity, delay: i * 1.2, times: [0, 0.1, 0.3] }}>
            <circle cx={n.x} cy={n.y} r="34" fill={`${accent}14`} stroke={`${accent}73`} strokeWidth="1.5" />
            <text x={n.x} y={n.y - 2} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="12" fontWeight="700" fill="#fff">{n.label}</text>
            <text x={n.x} y={n.y + 13} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8.5" fill="#8b98a8">{n.sub}</text>
          </motion.g>
        ))}

        {/* exit to answer */}
        <path d={`M${N.reason.x + 30},${N.reason.y - 10} Q ${W - 30},10 ${W - 36},40`} fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#ah)" opacity="0.8" />
        <text x={W - 36} y={56} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="10" fill={accent}>✓ answer</text>
      </svg>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 8, textAlign: 'center' }}>
        Each turn the agent reasons over the trace so far, calls one tool, reads the result — and repeats until it can answer.
      </div>
    </div>
  );
}
