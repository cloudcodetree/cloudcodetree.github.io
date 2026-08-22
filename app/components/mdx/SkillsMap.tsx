'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke capstone illustration: the hireable skills the course covers, each a
 * chip that lights ✓ with the part that proves it. They check in one by one —
 * "here's everything you can now claim, with evidence." Static-safe.
 */

const SKILLS = [
  ['Data engineering', '1'],
  ['LLM internals', '2'],
  ['Supervised ML', '3'],
  ['Recommenders', '4'],
  ['Retrieval / RAG', '5'],
  ['Structured output', '6'],
  ['Fine-tuning (QLoRA)', '7'],
  ['Agents', '8'],
  ['MCP', '9'],
  ['Responsible AI', '10'],
  ['Evaluation', '11'],
  ['Serving / inference', '12'],
  ['Deployment', '13'],
  ['Observability / FinOps', '14'],
  ['AI system design', '15'],
];

export default function SkillsMap({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        What you can now claim — with proof
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SKILLS.map(([skill, part], i) => (
          <motion.div
            key={skill}
            style={{ display: 'flex', alignItems: 'center', gap: 7, border: `1px solid ${accent}59`, background: `${accent}0d`, borderRadius: 8, padding: '7px 11px' }}
            initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ amount: 0.2 }} transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 20 }}
          >
            <motion.span
              style={{ color: '#94bce3', fontWeight: 700, fontSize: 12 }}
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.1 }}
            >✓</motion.span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#fff' }}>{skill}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>p{part}</span>
          </motion.div>
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        Not "I studied these" — <span style={{ color: accent }}>"I built and tested these,"</span> with a repo to show.
      </div>
    </div>
  );
}
