'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of pgvector HNSW index traversal: each deal is a point
 * in 2D (a PCA-style projection of the 384-dim bge-small-en-v1.5 space, laid
 * out by hand to reflect the real headphones cluster). When the learner hovers
 * "noise cancelling headphones", a query point appears and the HNSW graph
 * traversal animates — highlighted edges, candidate nodes turn gold, eliminated
 * nodes fade — until the top-5 results settle.
 *
 * Hero cast: Sony WH-1000XM5 ($162.97 — FAIR), Anker Q20i ($44.99 — DEAL),
 * Bose QC45 ($46 — SUSPICIOUS), Sony XM6 ($399.99 — OVERPRICED).
 * Distinct shape: node-edge HNSW traversal path — no other component shows this.
 * Static-export safe: all positions are static props; no runtime fetch.
 */

type Node = {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  group: 'hero' | 'other';
  badge?: string;
};

const NODES: Node[] = [
  // hero cast
  { id: 'xm5', label: 'Sony WH-1000XM5', sub: '$162.97 FAIR', x: 42, y: 38, group: 'hero', badge: 'FAIR' },
  { id: 'q20i', label: 'Anker Q20i', sub: '$44.99 DEAL', x: 28, y: 58, group: 'hero', badge: 'DEAL' },
  { id: 'qc45', label: 'Bose QC45', sub: '$46 SUSPICIOUS', x: 54, y: 28, group: 'hero', badge: 'SUSPICIOUS' },
  { id: 'xm6', label: 'Sony XM6', sub: '$399.99 OVERPRICED', x: 62, y: 46, group: 'hero', badge: 'OVERPRICED' },
  // background items
  { id: 'b1', label: 'JBL Tune 510BT', sub: '$37.95', x: 20, y: 44, group: 'other' },
  { id: 'b2', label: 'Jabra Evolve2', sub: '$219.00', x: 36, y: 22, group: 'other' },
  { id: 'b3', label: 'Beats Studio3', sub: '$149.95', x: 50, y: 62, group: 'other' },
  { id: 'b4', label: 'COWIN E7', sub: '$29.99', x: 18, y: 70, group: 'other' },
  { id: 'b5', label: 'Dell Monitor', sub: '$399.00', x: 82, y: 30, group: 'other' },
  { id: 'b6', label: 'MacBook Air', sub: '$999.00', x: 78, y: 62, group: 'other' },
  { id: 'b7', label: 'Logitech MX Master', sub: '$89.99', x: 70, y: 78, group: 'other' },
];

// HNSW graph edges: each node connects to ~4 nearest in this layout
const EDGES: [string, string][] = [
  ['xm5', 'qc45'], ['xm5', 'q20i'], ['xm5', 'xm6'], ['xm5', 'b2'],
  ['qc45', 'xm6'], ['qc45', 'b2'],
  ['q20i', 'b1'], ['q20i', 'b4'], ['q20i', 'b3'],
  ['xm6', 'b3'], ['xm6', 'b5'],
  ['b1', 'b4'], ['b2', 'xm6'], ['b3', 'b7'],
  ['b5', 'b6'], ['b6', 'b7'],
];

// Traversal path from entry point (xm6) to top-5 results
// Steps: [(from, to, phase)] — 'traverse' = exploring, 'settle' = final top-5
const TRAVERSAL: { from: string; to: string; phase: 'traverse' | 'settle'; delay: number }[] = [
  { from: 'xm6', to: 'qc45', phase: 'traverse', delay: 0.4 },
  { from: 'qc45', to: 'xm5', phase: 'traverse', delay: 0.7 },
  { from: 'xm5', to: 'q20i', phase: 'traverse', delay: 1.0 },
  { from: 'xm5', to: 'b2', phase: 'traverse', delay: 1.2 },
  { from: 'q20i', to: 'b1', phase: 'traverse', delay: 1.4 },
  // settle: top-5 confirmed
  { from: 'xm5', to: 'xm5', phase: 'settle', delay: 1.8 },
  { from: 'q20i', to: 'q20i', phase: 'settle', delay: 1.9 },
  { from: 'qc45', to: 'qc45', phase: 'settle', delay: 2.0 },
  { from: 'xm6', to: 'xm6', phase: 'settle', delay: 2.1 },
  { from: 'b1', to: 'b1', phase: 'settle', delay: 2.2 },
];

const TOP5 = new Set(['xm5', 'q20i', 'qc45', 'xm6', 'b1']);
const TRAVERSED = new Set(['xm5', 'q20i', 'qc45', 'xm6', 'b2', 'b1']);

const BADGE_COLOR: Record<string, string> = {
  FAIR: '#8b98a8',
  DEAL: '#3fb950',
  SUSPICIOUS: '#e3b341',
  OVERPRICED: '#6e7681',
};

function nodePos(id: string) {
  const n = NODES.find(n => n.id === id)!;
  return { x: n.x, y: n.y };
}

export default function VectorIndex({ accent = ACCENT }: { accent?: string }) {
  const [active, setActive] = useState(false);

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
          marginBottom: 14,
        }}
      >
        HNSW index traversal — pgvector cosine search
      </div>

      {/* Query trigger */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => setActive(v => !v)}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            padding: '5px 14px',
            borderRadius: 999,
            border: `1.5px solid ${accent}`,
            background: active ? `${accent}22` : 'transparent',
            color: active ? accent : '#8b98a8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {active ? 'reset' : 'query: "noise cancelling headphones"'}
        </button>
        <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
          {active ? 'HNSW traversal animating — top-5 settling' : 'click to run the query'}
        </span>
      </div>

      {/* Graph canvas */}
      <div
        style={{
          position: 'relative',
          height: 280,
          border: '1px solid rgba(148,163,184,0.10)',
          borderRadius: 10,
          background: 'rgba(148,163,184,0.02)',
          overflow: 'hidden',
        }}
      >
        {/* HNSW edges — static faint layer */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          aria-hidden
        >
          {EDGES.map(([a, b]) => {
            const pa = nodePos(a);
            const pb = nodePos(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={`${pa.x}%`} y1={`${pa.y}%`}
                x2={`${pb.x}%`} y2={`${pb.y}%`}
                stroke="rgba(148,163,184,0.12)"
                strokeWidth={1}
              />
            );
          })}
        </svg>

        {/* Traversal animated edges */}
        <AnimatePresence>
          {active && (
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              aria-hidden
            >
              {TRAVERSAL.filter(t => t.from !== t.to).map((t, i) => {
                const pa = nodePos(t.from);
                const pb = nodePos(t.to);
                return (
                  <motion.line
                    key={`trav-${i}`}
                    x1={`${pa.x}%`} y1={`${pa.y}%`}
                    x2={`${pb.x}%`} y2={`${pb.y}%`}
                    stroke={t.phase === 'settle' ? accent : '#e3b341'}
                    strokeWidth={t.phase === 'settle' ? 2 : 1.5}
                    strokeDasharray={t.phase === 'traverse' ? '3 3' : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: t.delay, duration: 0.35 }}
                  />
                );
              })}
            </svg>
          )}
        </AnimatePresence>

        {/* Nodes */}
        {NODES.map((n, i) => {
          const isTop5 = TOP5.has(n.id);
          const isTraversed = active && TRAVERSED.has(n.id);
          const isSettled = active && isTop5;
          const isFaded = active && !TRAVERSED.has(n.id);

          return (
            <motion.div
              key={n.id}
              style={{
                position: 'absolute',
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                zIndex: n.group === 'hero' ? 2 : 1,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: isFaded ? 0.2 : 1,
                scale: isSettled ? 1.15 : 1,
              }}
              whileInView={{ opacity: isFaded ? 0.2 : 1, scale: isSettled ? 1.15 : 1 }}
              viewport={{ amount: 0.3 }}
              transition={{
                opacity: { delay: active ? 0 : 0.05 + i * 0.06 },
                scale: { delay: active ? 2.0 : 0.05 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 },
              }}
            >
              {/* Node dot */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: n.group === 'hero' ? 12 : 8,
                    height: n.group === 'hero' ? 12 : 8,
                    borderRadius: '50%',
                    background: isSettled
                      ? accent
                      : isTraversed
                      ? '#e3b341'
                      : n.group === 'hero'
                      ? '#3b82f6'
                      : 'rgba(148,163,184,0.4)',
                    border: isSettled ? `2px solid ${accent}` : 'none',
                    transition: 'background 0.3s',
                  }}
                />
                {/* Pulse ring on settle */}
                {isSettled && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: -5,
                      borderRadius: '50%',
                      border: `1.5px solid ${accent}`,
                    }}
                    animate={{ opacity: [0.8, 0], scale: [1, 1.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
                  />
                )}
              </div>

              {/* Label (hero only) */}
              {n.group === 'hero' && (
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    color: isSettled ? '#cdd7e2' : '#8b98a8',
                    background: 'rgba(13,17,23,0.82)',
                    padding: '1px 4px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    border: isSettled ? `1px solid ${accent}44` : '1px solid transparent',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    transition: 'border-color 0.3s, color 0.3s',
                  }}
                >
                  <div>{n.label}</div>
                  <div style={{ color: n.badge ? BADGE_COLOR[n.badge] : '#8b98a8' }}>{n.sub}</div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Query point */}
        <AnimatePresence>
          {active && (
            <motion.div
              style={{
                position: 'absolute',
                left: '35%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                zIndex: 10,
              }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 22 }}
            >
              <motion.div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: accent,
                  border: '2px solid #fff',
                }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  color: accent,
                  fontWeight: 700,
                  background: 'rgba(13,17,23,0.85)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                query embedding
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          marginTop: 12,
          flexWrap: 'wrap',
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
        }}
      >
        <span><span style={{ color: '#3b82f6' }}>●</span> headphones (hero cast)</span>
        <span><span style={{ color: '#e3b341' }}>●</span> traversed by HNSW</span>
        <span><span style={{ color: accent }}>●</span> top-5 results (settled)</span>
        <span><span style={{ color: 'rgba(148,163,184,0.4)' }}>●</span> pruned (never visited)</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 8, lineHeight: 1.6 }}>
        HNSW visits a tiny fraction of nodes — it traverses the graph, not every row. The <i>Hierarchical</i> in HNSW: the real structure is a stack of layers — sparse &quot;express lanes&quot; on top for coarse jumps across the space, denser layers below for refinement. The search enters at the top, drops down layer by layer, and only the bottom layer (the one drawn here) contains every point; that hierarchy is what makes search roughly logarithmic instead of linear. The Bose QC45 at $46 (SUSPICIOUS) ranks 3rd by cosine similarity: correct by relevance, flagged downstream by the deal-score guard.
      </div>
    </div>
  );
}
