'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * CosineAngle — what cosine similarity actually IS (the angle between two vectors),
 * reused wherever the course leans on it undefined (dedup threshold P9, pgvector
 * `<=>` P13, semantic cache P26). Two static SVG panels: a small angle (high
 * similarity) vs a wide angle (low). Hydration-safe (static geometry + framer opacity).
 */

const GREEN = '#3fb950';
const MUT = '#8b98a8';
const O = { x: 18, y: 78 }; // origin in a 100x92 svg

function arrow(to: { x: number; y: number }, color: string, key: string) {
  return <line key={key} x1={O.x} y1={O.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="2.4" markerEnd="url(#ca-arrow)" />;
}

function Panel({
  title, a, b, cos, note, accent,
}: { title: string; a: { x: number; y: number }; b: { x: number; y: number }; cos: string; note: string; accent: string }) {
  return (
    <div style={{ flex: '1 1 210px', minWidth: 200 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff', fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <svg viewBox="0 0 100 92" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <marker id="ca-arrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill={accent} />
          </marker>
        </defs>
        {arrow(a, accent, 'a')}
        {arrow(b, accent, 'b')}
        {/* small arc hint between the two vectors near the origin */}
        <path d={`M ${O.x + 14},${O.y - 4} A 15 15 0 0 1 ${O.x + 10},${O.y - 12}`} fill="none" stroke={MUT} strokeWidth="1" opacity="0.7" />
        <text x={O.x + 20} y={O.y - 8} fontFamily="Menlo, monospace" fontSize="7" fill={MUT}>θ</text>
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: accent, marginTop: 2 }}>cos θ = {cos}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: MUT }}>{note}</div>
    </div>
  );
}

export default function CosineAngle({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        Cosine similarity = the angle between two vectors
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <motion.div style={{ flex: '1 1 210px', minWidth: 200 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }}>
          <Panel title="small angle → similar" a={{ x: 90, y: 24 }} b={{ x: 82, y: 34 }} cos="0.97" note='"WH-1000XM5" ↔ the other XM5 listing' accent={GREEN} />
        </motion.div>
        <motion.div style={{ flex: '1 1 210px', minWidth: 200 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.15 }}>
          <Panel title="wide angle → different" a={{ x: 90, y: 24 }} b={{ x: 94, y: 66 }} cos="0.55" note='headphones ↔ a USB cable' accent={MUT} />
        </motion.div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 14, lineHeight: 1.6 }}>
        Cosine similarity is <code>(A·B)/(‖A‖‖B‖)</code> — the cosine of the angle between two embedding vectors, ignoring their length.
        {' '}<b style={{ color: GREEN }}>1.0</b> = same direction (identical meaning), <b>0</b> = perpendicular (unrelated), <b>−1</b> = opposite.
        {' '}That&apos;s why a <b style={{ color: accent }}>0.90</b> threshold means &quot;point almost the same way&quot; — near-duplicates clear it; a headphone and a cable don&apos;t.
        {' '}(pgvector&apos;s <code>&lt;=&gt;</code> returns cosine <i>distance</i> = <code>1 − similarity</code>, so smaller = closer.)
      </div>
    </div>
  );
}
