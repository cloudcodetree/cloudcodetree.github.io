'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of sampling temperature (Transformer-Explainer style): the
 * model outputs a probability for every possible next token; temperature reshapes
 * that distribution before one is picked. The bars loop between a low-temp shape
 * (peaked → near-deterministic) and a high-temp shape (flattened → creative), so
 * "temperature = how much you flatten the odds" lands visually.
 *
 * Distributions are illustrative softmax shapes. Static-safe: words + the low-temp
 * shape render with no JS; the label explains the swing.
 */

// Prompt simulates two use-cases from the DealFinder pipeline:
// temp=0 for deterministic JSON extraction; temp>0 for user-facing summaries.
const PROMPT = 'Is the Bose QC45 at $46 a genuine deal?';
// [low-temp width%, high-temp width%] per candidate next token
// Low-temp: the model almost always picks the structured/cautious answer.
// High-temp: creative outputs ("possibly refurbished", "check seller rating") emerge.
const CANDIDATES = [
  { t: '{"deal":false}', lo: 88, hi: 32 },
  { t: 'possibly refurbished', lo: 7, hi: 26 },
  { t: 'check seller rating', lo: 3, hi: 20 },
  { t: 'suspiciously cheap', lo: 1.5, hi: 14 },
  { t: 'yes, grab it', lo: 0.5, hi: 8 },
];

export default function TemperatureSampler({ accent = ACCENT }: { accent?: string }) {
  // shared loop: 0–0.45 low temp, 0.55–1 high temp
  const widths = (lo: number, hi: number) => [`${lo}%`, `${lo}%`, `${hi}%`, `${hi}%`, `${lo}%`];
  const times = [0, 0.42, 0.55, 0.92, 1];
  const loop = { duration: 7, times, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 10 }}>
        Next-token odds — and how temperature reshapes them
      </div>

      <div style={{ fontFamily: MONO, fontSize: 12, color: '#cdd7e2', marginBottom: 14 }}>
        {PROMPT} <span style={{ color: accent }}>▮</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CANDIDATES.map((c, i) => (
          <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: i === 0 ? '#fff' : '#8b98a8', width: 92, textAlign: 'right', flex: '0 0 auto' }}>{c.t}</span>
            <div style={{ flex: 1, height: 16, background: 'rgba(148,163,184,0.07)', borderRadius: 5, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 5, background: i === 0 ? accent : `${accent}66` }}
                initial={{ width: `${c.lo}%` }}
                whileInView={{ width: widths(c.lo, c.hi) }}
                viewport={{ amount: 0.4 }}
                transition={loop}
              />
            </div>
          </div>
        ))}
      </div>

      {/* temperature state label crossfades in sync with the bars */}
      <div style={{ position: 'relative', height: 20, marginTop: 14 }}>
        <motion.div
          style={{ position: 'absolute', inset: 0, fontFamily: MONO, fontSize: 11, color: accent }}
          initial={{ opacity: 1 }}
          whileInView={{ opacity: [1, 1, 0, 0, 1] }}
          viewport={{ amount: 0.4 }}
          transition={loop}
        >
          temperature <b>0</b> — peaked → picks <b>{'{'}&#34;deal&#34;:false{'}'}</b> every time (deterministic, testable)
        </motion.div>
        <motion.div
          style={{ position: 'absolute', inset: 0, fontFamily: MONO, fontSize: 11, color: '#d29922' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: [0, 0, 1, 1, 0] }}
          viewport={{ amount: 0.4 }}
          transition={loop}
        >
          temperature <b>0.9</b> — flattened → varied prose: &ldquo;possibly refurbished&rdquo;, &ldquo;check seller rating&rdquo;&hellip;
        </motion.div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 10 }}>
        For DealFinder&apos;s JSON extraction you want temperature <span style={{ color: accent }}>0</span> — same input, same output.
      </div>
    </div>
  );
}
