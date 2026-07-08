'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke capstone illustration: the full DealFinder 33-part system as an
 * architecture flow. Visual metaphor: a vertical pipeline map where a "request"
 * descends through distinct bands, each annotated with the parts that built it.
 *
 * Bands (top→bottom):
 *   Interfaces      — Web SPA · MCP · Agent
 *   Aggregator      — live multi-source + circuit breaker
 *   Intelligence    — deal score · semantic search · recommender · extractor
 *   Persistence     — pgvector · Postgres · semantic cache
 *   MLOps loop      — drift → retrain → eval gate → promote
 *   SaaS platform   — auth · payments · security · saved searches
 *   Infra & ops     — Docker · K8s · Terraform · CI/CD · observability · runbook
 *
 * A single "request" node animates down the stack (looping). Each band fades in
 * once; the pulse animates on repeat to show the system is alive.
 * Static-safe: all text is real DOM text.
 */

type Band = {
  tag: string;
  color: string;
  label: string;
  parts: string;
  chips: string[];
};

const BANDS: Band[] = [
  {
    tag: 'interfaces',
    color: ACCENT,
    label: 'Interfaces',
    parts: '11,12,14,27',
    chips: ['React/Vite SPA', 'SSE + fallback', 'MCP server', 'ReAct agent'],
  },
  {
    tag: 'aggregator',
    color: '#58a6ff',
    label: 'Live aggregator',
    parts: '7,8,9',
    chips: ['eBay · RapidAPI · Apify · Shopify · Firecrawl', 'Tiered early-stop', '90s circuit breaker', 'Dedup @0.90'],
  },
  {
    tag: 'intelligence',
    color: '#d29922',
    label: 'Intelligence layer',
    parts: '3–6,17–22',
    chips: ['Two-signal deal score', 'GBDT MAE $138.11', 'Semantic search + BM25 + RRF', 'Semantic cache 0.500@0.90', 'Recommender', 'Structured extractor'],
  },
  {
    tag: 'persistence',
    color: '#a371f7',
    label: 'Persistence',
    parts: '1,13',
    chips: ['pgvector (384-dim bge-small)', 'Postgres snapshot', 'Offer store'],
  },
  {
    tag: 'mlops',
    color: '#3fb950',
    label: 'MLOps loop',
    parts: '18–20',
    chips: ['PSI drift 0.043→0.318', 'MLflow registry', 'Eval gate p@5≥0.80', 'Canary promote'],
  },
  {
    tag: 'saas',
    color: '#f85149',
    label: 'SaaS platform',
    parts: '28–31',
    chips: ['Supabase JWT auth', 'Stripe free/pro gating', 'Rate limiter [T,T,T,F,F]', 'GDPR export/delete', 'Saved searches'],
  },
  {
    tag: 'infra',
    color: '#8b98a8',
    label: 'Infra & ops',
    parts: '24–26,32',
    chips: ['Docker + Terraform', 'K8s HPA 2→10 @70%', 'CI eval gate', 'Grafana/Langfuse', '166 tests · 5 e2e', 'RUNBOOK.md'],
  },
];

export default function ArchitectureFlow({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.5)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        DealFinder · full system · 33 parts · one architecture
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        A user query enters at the top and flows down through every layer you built.
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Main stack */}
        <div style={{ flex: '1 1 340px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {BANDS.map((band, i) => (
            <motion.div
              key={band.tag}
              style={{
                border: `1px solid ${band.color}40`,
                background: `${band.color}08`,
                borderRadius: 9,
                padding: '10px 13px',
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.25 }}
              transition={{ delay: i * 0.1, duration: 0.38 }}
            >
              {/* Band header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: band.color, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                  {band.label}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>
                  parts {band.parts}
                </span>
              </div>

              {/* Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {band.chips.map((chip) => (
                  <span
                    key={chip}
                    style={{
                      fontFamily: MONO, fontSize: 10, color: '#cdd7e2',
                      border: '1px solid rgba(148,163,184,0.18)',
                      borderRadius: 5, padding: '2px 7px',
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>

              {/* Downward pulse between bands (not on last) */}
              {i < BANDS.length - 1 && (
                <motion.div
                  style={{ textAlign: 'center', fontSize: 12, marginTop: 4, marginBottom: -2 }}
                  animate={{ opacity: [0.15, 0.8, 0.15], y: [0, 2, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.32 }}
                >
                  <span style={{ color: band.color }}>↓</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Request pulse column */}
        <motion.div
          style={{
            flex: '0 0 120px', minWidth: 100,
            border: `1px dashed ${accent}44`,
            borderRadius: 9, padding: '12px 10px',
            background: `${accent}06`,
            display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
          }}
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: 0.6 }}
        >
          <div style={{ fontFamily: MONO, fontSize: 9, color: accent, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center', marginBottom: 8 }}>
            request path
          </div>

          {/* Animated request node */}
          {BANDS.map((band, i) => (
            <motion.div
              key={band.tag}
              style={{
                width: 64, height: 20, borderRadius: 6,
                border: `1px solid ${band.color}80`,
                background: `${band.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              animate={{ opacity: [0.3, 0.95, 0.3], scale: [0.97, 1.02, 0.97] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.36 }}
            >
              <span style={{ fontFamily: MONO, fontSize: 8, color: band.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {band.tag}
              </span>
            </motion.div>
          ))}

          <div style={{ fontFamily: MONO, fontSize: 8, color: '#8b98a8', textAlign: 'center', marginTop: 6 }}>
            "noise cancelling<br />headphones"
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16, borderTop: '1px solid rgba(148,163,184,0.10)', paddingTop: 10 }}>
        Each band is a tested, committed layer. The <span style={{ color: accent }}>hero cast</span> — Sony XM5 · Anker Q20i · Bose QC45 · Sony XM6 — flows through all of it.
      </div>
    </div>
  );
}
