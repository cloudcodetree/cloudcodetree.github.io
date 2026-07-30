'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * KVCache — why generation gets cheap after the first token (P27 vLLM /
 * PagedAttention). Autoregressive decoding needs every previous token's
 * key/value vectors at every step; without a cache you recompute all of them
 * per token (quadratic), with a cache you store them and compute only the new
 * token's K/V. Div grid + framer opacity = hydration-safe.
 */

const GREEN = '#3fb950';
const AMBER = '#f0a30a';
const MUT = '#8b98a8';

const TOKENS = ['The', 'best', 'deal', 'is'];

function Cell({ kind }: { kind: 'fresh' | 'cached' | 'empty' }) {
  const style: React.CSSProperties = {
    width: 26, height: 18, borderRadius: 3, fontFamily: MONO, fontSize: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  if (kind === 'empty') return <div style={{ ...style, visibility: 'hidden' }} />;
  if (kind === 'fresh') return <div style={{ ...style, background: 'rgba(240,163,10,0.18)', border: `1px solid ${AMBER}`, color: AMBER }}>KV</div>;
  return <div style={{ ...style, background: 'rgba(63,185,80,0.12)', border: `1px solid ${GREEN}66`, color: GREEN }}>KV</div>;
}

function Panel({ title, cached, cost, costColor }: { title: string; cached: boolean; cost: string; costColor: string }) {
  return (
    <div style={{ flex: '1 1 230px', minWidth: 220 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#fff', fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {/* header row: token being generated at each step */}
      <div style={{ display: 'grid', gridTemplateColumns: `70px repeat(${TOKENS.length}, 30px)`, gap: 4, alignItems: 'center' }}>
        <div />
        {TOKENS.map((t) => (
          <div key={t} style={{ fontFamily: MONO, fontSize: 9, color: MUT, textAlign: 'center' }}>{t}</div>
        ))}
        {TOKENS.map((_, step) => (
          [
            <div key={`l${step}`} style={{ fontFamily: MONO, fontSize: 9, color: MUT }}>step {step + 1}</div>,
            ...TOKENS.map((_, col) => {
              if (col > step) return <Cell key={`${step}-${col}`} kind="empty" />;
              // at step N: token N's K/V is always computed fresh; earlier ones
              // are recomputed (no cache) or reused (cache).
              const kind = col === step ? 'fresh' : cached ? 'cached' : 'fresh';
              return <Cell key={`${step}-${col}`} kind={kind} />;
            }),
          ]
        ))}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: costColor, fontWeight: 700, marginTop: 8 }}>{cost}</div>
    </div>
  );
}

export default function KVCache({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        The KV cache — remember every token&apos;s keys &amp; values
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginBottom: 14 }}>
        each generated token must attend to <i>all</i> previous tokens&apos; K/V vectors — one row per decode step
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <motion.div style={{ flex: '1 1 230px', minWidth: 220 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }}>
          <Panel title="no cache — recompute everything" cached={false} cost="10 K/V computations for 4 tokens (grows ~n²)" costColor={AMBER} />
        </motion.div>
        <motion.div style={{ flex: '1 1 230px', minWidth: 220 }} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.15 }}>
          <Panel title="KV cache — reuse, compute only the new one" cached cost="4 K/V computations (1 per new token)" costColor={GREEN} />
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 12, fontFamily: MONO, fontSize: 10, color: MUT }}>
        <span><span style={{ color: AMBER }}>■</span> computed this step</span>
        <span><span style={{ color: GREEN }}>■</span> reused from cache</span>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, marginTop: 14, lineHeight: 1.6 }}>
        Attention needs a <b style={{ color: accent }}>key</b> and <b style={{ color: accent }}>value</b> vector for every token in the context. Without a cache, each new token forces recomputing K/V for the entire prefix — cost grows quadratically. The <b style={{ color: GREEN }}>KV cache</b> stores them once, so each decode step computes exactly one new K/V pair. The trade: that cache lives in GPU memory and <b style={{ color: AMBER }}>grows with sequence length × batch size</b> — for long contexts it dwarfs the weights. That memory pressure is exactly what vLLM&apos;s <b style={{ color: '#cdd7e2' }}>PagedAttention</b> manages: it allocates the cache in small virtual-memory-style pages instead of one contiguous block, so concurrent requests pack tightly with no fragmentation.
      </div>
    </div>
  );
}
