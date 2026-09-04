'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * LostInMiddle — the U-curve behind the reorder trick (P16): recall of a fact
 * is high when it sits at the start or end of a long context and dips when it
 * is buried in the middle (Liu et al. 2023, "Lost in the Middle"). Curve shape
 * is illustrative, not a benchmark. Static SVG + framer opacity = hydration-safe.
 */

const GREEN = '#94bce3';
const AMBER = '#f0a30a';
const MUT = '#8b98a8';

export default function LostInMiddle({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        &quot;Lost in the middle&quot; — recall vs. position of the evidence
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginBottom: 12 }}>
        same fact, same question — only its <i>position</i> in the context moves (shape per Liu et al. 2023, illustrative)
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }}>
        <svg viewBox="0 0 230 112" style={{ width: '100%', maxWidth: 460, height: 'auto', display: 'block' }}>
          {/* axes */}
          <line x1="26" y1="10" x2="26" y2="88" stroke="rgba(148,163,184,0.3)" />
          <line x1="26" y1="88" x2="214" y2="88" stroke="rgba(148,163,184,0.3)" />
          <text x="10" y="52" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={MUT} transform="rotate(-90 10 52)">recall accuracy</text>
          <text x="120" y="100" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={MUT}>position of the key document in the context</text>
          <text x="34" y="97" fontFamily="Menlo, monospace" fontSize="7" fill={GREEN}>1st</text>
          <text x="118" y="97" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={AMBER}>middle</text>
          <text x="206" y="97" textAnchor="end" fontFamily="Menlo, monospace" fontSize="7" fill={GREEN}>last</text>

          {/* the U curve */}
          <path d="M 34,22 C 70,64 100,70 120,70 C 140,70 172,64 206,26" fill="none" stroke={accent} strokeWidth="2.2" />

          {/* edge + middle markers */}
          <circle cx="34" cy="22" r="3.5" fill={GREEN} />
          <circle cx="206" cy="26" r="3.5" fill={GREEN} />
          <circle cx="120" cy="70" r="3.5" fill={AMBER} />
          <text x="44" y="18" fontFamily="Menlo, monospace" fontSize="7" fill={GREEN}>~75% — attended well</text>
          <text x="120" y="82" textAnchor="middle" fontFamily="Menlo, monospace" fontSize="7" fill={AMBER}>~55% — the dip</text>
          <text x="200" y="18" textAnchor="end" fontFamily="Menlo, monospace" fontSize="7" fill={GREEN}>~72%</text>
        </svg>
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 12, lineHeight: 1.6 }}>
        Feed a model 20 documents and ask a question only one of them answers: if that document is <b style={{ color: GREEN }}>first or last</b>, the model usually finds it; slide the <i>same document</i> to the <b style={{ color: AMBER }}>middle</b> and accuracy drops by ~20 points. Nothing about the content changed — only where attention had to look. That U-shape is why <code>lost_in_the_middle</code> reorders the packed block so the strongest picks <b style={{ color: accent }}>bracket the edges</b> and only the weakest evidence sits in the dip.
      </div>
    </div>
  );
}
