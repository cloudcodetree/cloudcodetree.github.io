'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of attention (BertViz head-view style): while the model
 * processes one token, it "looks at" the others by a learned weight — drawn as
 * connecting lines whose thickness/opacity is the attention weight. Here, while
 * reading "tent", the strongest links are to "2-person" and "ultralight" — the
 * words that actually qualify it — and almost nothing to "for".
 *
 * Self-contained SVG (fixed viewBox, scales responsively). Lines draw in then
 * pulse by weight. Weights are illustrative; the *pattern* (content words win)
 * is the lesson. Static-safe: tokens are real <text> in the DOM.
 */

const TOK = [
  { t: 'ultralight', w: 0.42 },
  { t: '2-person', w: 0.70 },
  { t: 'tent', w: 0.18 },
  { t: 'for', w: 0.05 },
  { t: 'backpacking', w: 0.33 },
];

const W = 600, H = 200;
const xs = TOK.map((_, i) => 60 + i * ((W - 120) / (TOK.length - 1)));
const focusX = xs[2]; // "tent"

export default function AttentionView({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Attention: which words does &quot;tent&quot; look at?
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 12 }}>
        thicker line = more attention
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* lines: focus token → every token, weighted */}
        {TOK.map((tok, i) => (
          <motion.line
            key={`l${i}`}
            x1={focusX} y1={150} x2={xs[i]} y2={58}
            stroke={accent}
            strokeWidth={1 + tok.w * 9}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: [0, Math.max(0.12, tok.w), Math.max(0.12, tok.w) * 0.6, Math.max(0.12, tok.w)] }}
            viewport={{ amount: 0.4 }}
            transition={{ pathLength: { delay: 0.2 + i * 0.12, duration: 0.5 }, opacity: { delay: 0.2 + i * 0.12, duration: 2.4, repeat: Infinity, repeatType: 'reverse' } }}
          />
        ))}

        {/* context tokens (top) */}
        {TOK.map((tok, i) => {
          const w = tok.t.length * 8.4 + 18;
          return (
            <motion.g
              key={`t${i}`}
              initial={{ opacity: 0, y: -6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.4 }}
              transition={{ delay: i * 0.08 }}
            >
              <rect x={xs[i] - w / 2} y={36} width={w} height={28} rx={7}
                fill={i === 2 ? `${accent}1a` : 'rgba(148,163,184,0.06)'}
                stroke={i === 2 ? `${accent}73` : 'rgba(148,163,184,0.2)'} />
              <text x={xs[i]} y={54} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={13} fill="#cdd7e2">{tok.t}</text>
              <text x={xs[i]} y={24} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={10} fill={accent} opacity={0.9}>{tok.w.toFixed(2)}</text>
            </motion.g>
          );
        })}

        {/* focus token (bottom) */}
        <g>
          <rect x={focusX - 95} y={150} width={190} height={32} rx={9} fill={`${accent}14`} stroke={`${accent}73`} />
          <text x={focusX} y={171} textAnchor="middle" fontFamily="Menlo, monospace" fontSize={13} fill="#fff">
            processing: <tspan fill={accent} fontWeight="700">tent</tspan>
          </text>
        </g>
      </svg>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 12 }}>
        The qualifiers (<span style={{ color: '#cdd7e2' }}>2-person</span>, <span style={{ color: '#cdd7e2' }}>ultralight</span>) win; the filler (<span style={{ color: '#cdd7e2' }}>for</span>) is ignored. That&apos;s how context, not just the word, shapes meaning.
      </div>
    </div>
  );
}
