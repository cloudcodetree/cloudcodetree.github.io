'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of tokenization (Tiktokenizer-style): text is split into
 * colored subword chunks, each with an id, and the count is what you're billed.
 * Shows the things that surprise people — spaces ride along with the next word,
 * numbers fragment, casing splits — so "tokens != words" lands visually.
 *
 * IDs are illustrative (the SPLIT is what's accurate and teachable). Chips stagger
 * in; the running count ticks up. Static-safe: all tokens are real text in the DOM.
 */

// A BPE-style split of a product title. text includes the leading space where the
// real tokenizer keeps it; we render '·' for a leading space so it's visible.
// Input: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones"
// Note how the model-number identifier WH-1000XM5 fragments into 6 tokens.
// Real cl100k_base (GPT-4/3.5) token/id pairs — 13 tokens. Verified with tiktoken.
const TOKENS: { t: string; id: number }[] = [
  { t: 'Sony', id: 63365 }, { t: ' WH', id: 8662 }, { t: '-', id: 12 },
  { t: '100', id: 1041 }, { t: '0', id: 15 }, { t: 'XM', id: 53437 },
  { t: '5', id: 20 }, { t: ' Wireless', id: 34742 }, { t: ' Noise', id: 51623 },
  { t: ' Canc', id: 81423 }, { t: 'elling', id: 6427 }, { t: ' Head', id: 11452 },
  { t: 'phones', id: 17144 },
];

const PALETTE = ['#3fb95033', '#2f81f733', '#d2992233', '#a371f733', '#f0598333'];
const BORDER = ['#3fb95088', '#2f81f788', '#d2992288', '#a371f788', '#f0598388'];

export default function Tokenizer({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        Text → tokens (what the model — and your bill — actually sees)
      </div>
      <div style={{ fontFamily: MONO, fontSize: 12, color: '#cdd7e2', marginBottom: 14 }}>
        &quot;Sony WH-1000XM5 Wireless Noise Cancelling Headphones&quot;
      </div>

      <motion.div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.4 }}
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      >
        {TOKENS.map((tok, i) => (
          <motion.div
            key={i}
            variants={{ hidden: { opacity: 0, y: 8, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: PALETTE[i % PALETTE.length], border: `1px solid ${BORDER[i % BORDER.length]}`,
              borderRadius: 7, padding: '5px 8px', minWidth: 22,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 13, color: '#fff', whiteSpace: 'pre' }}>
              {tok.t.startsWith(' ') ? '·' + tok.t.slice(1) : tok.t}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>{tok.id}</span>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap', fontFamily: MONO, fontSize: 11, color: '#8b98a8' }}>
        <span><span style={{ color: accent, fontWeight: 700 }}>{TOKENS.length} tokens</span> · 6 words</span>
        <span>· <code style={{ color: '#cdd7e2' }}>·</code> = leading space</span>
        <span>· &ldquo;WH-1000XM5&rdquo; alone = 6 tokens</span>
        <span>· billed per token, in <em>and</em> out</span>
      </div>
    </div>
  );
}
