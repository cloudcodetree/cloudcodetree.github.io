'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * K8sReconcile — the reconciliation loop behind every manifest (P29): YAML is a
 * *declaration* of desired state; controllers run observe → diff → act forever,
 * converging actual state to it. Self-healing and the HPA are just writers to
 * the desired state. Static SVG geometry + framer opacity = hydration-safe.
 */

const GREEN = '#3fb950';
const AMBER = '#f0a30a';
const MUT = '#8b98a8';

function Box({ x, y, w, h, stroke }: { x: number; y: number; w: number; h: number; stroke: string }) {
  return <rect x={x} y={y} width={w} height={h} rx="6" fill="rgba(13,17,23,0.6)" stroke={stroke} strokeWidth="1.2" />;
}

export default function K8sReconcile({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        The reconciliation loop — YAML declares, controllers converge
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginBottom: 12 }}>
        scenario: <code>replicas: 2</code> is declared, and one pod just crashed
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }}>
        <svg viewBox="0 0 280 150" style={{ width: '100%', maxWidth: 520, height: 'auto', display: 'block' }}>
          <defs>
            <marker id="k8r-arrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 Z" fill={MUT} />
            </marker>
          </defs>

          {/* desired state (the spec) */}
          <Box x={92} y={6} w={96} h={26} stroke={accent} />
          <text x={140} y={17} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill={accent}>desired state</text>
          <text x={140} y={27} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#cdd7e2">replicas: 2</text>

          {/* observe */}
          <Box x={8} y={62} w={82} h={34} stroke={MUT} />
          <text x={49} y={75} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#cdd7e2">1. observe</text>
          <text x={49} y={87} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill={AMBER}>actual: 1 running</text>

          {/* diff */}
          <Box x={100} y={62} w={80} h={34} stroke={MUT} />
          <text x={140} y={75} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#cdd7e2">2. diff</text>
          <text x={140} y={87} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill={AMBER}>2 − 1 = 1 missing</text>

          {/* act */}
          <Box x={190} y={62} w={82} h={34} stroke={GREEN} />
          <text x={231} y={75} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#cdd7e2">3. act</text>
          <text x={231} y={87} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill={GREEN}>start 1 pod</text>

          {/* arrows: desired → diff, observe → diff, diff → act, act ⟲ observe */}
          <line x1={140} y1={32} x2={140} y2={58} stroke={MUT} strokeWidth="1.2" markerEnd="url(#k8r-arrow)" />
          <line x1={90} y1={79} x2={96} y2={79} stroke={MUT} strokeWidth="1.2" markerEnd="url(#k8r-arrow)" />
          <line x1={180} y1={79} x2={186} y2={79} stroke={MUT} strokeWidth="1.2" markerEnd="url(#k8r-arrow)" />
          <path d="M 231,96 C 231,132 49,132 49,100" fill="none" stroke={MUT} strokeWidth="1.2" markerEnd="url(#k8r-arrow)" />
          <text x={140} y={124} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill={MUT}>…and observe again — forever, every few seconds</text>

          {/* crash event */}
          <text x={49} y={54} textAnchor="middle" fontFamily="Menlo, monospace" fontSize="8" fill="#f85149">⚡ pod crashed</text>
        </svg>
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 12, lineHeight: 1.6 }}>
        Kubernetes is not executing your YAML as commands — the YAML is a <b style={{ color: accent }}>declaration</b>, and a controller loops <i>observe → diff → act</i> until actual state matches it. When the states match, the diff is zero and the loop does nothing. That one idea explains most of this part: <b style={{ color: '#cdd7e2' }}>self-healing</b> is the loop replacing a crashed pod; <code>kubectl apply</code> only edits the desired state and lets the loop do the work; and the <b style={{ color: '#cdd7e2' }}>HPA</b> is just another controller that <i>writes</i> a new <code>replicas</code> number for this loop to chase.
      </div>
    </div>
  );
}
