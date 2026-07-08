'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * NEW — Part 11 (dealfinder-agent) only.
 * Visual metaphor: a natural-language bubble slides in from the left, a SQL
 * card slides in from the right, and a two-row result table fades up from the
 * center bottom. Shows the gap between user intent and a structured query, and
 * how the LLM + a pruned schema bridges it.
 *
 * Static-export-safe. No runtime data fetch. All text is real DOM text.
 */

const SUSPICIOUS_CLR = '#d29922'; // amber
const DEAL_CLR       = '#3fb950'; // green

const ROWS = [
  { title: 'Anker Soundcore Q20i', price: '$44.99', badge: 'DEAL',       fair: '$108.33', badgeColor: DEAL_CLR },
  { title: 'Bose QuietComfort 45', price: '$46.00',  badge: 'SUSPICIOUS', fair: '$285.15', badgeColor: SUSPICIOUS_CLR },
];

export default function TextToSQL({ accent = ACCENT }: { accent?: string }) {
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
          marginBottom: 16,
        }}
      >
        Text-to-SQL — from intent to query
      </div>

      {/* Top row: NL bubble ←→ SQL card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        {/* NL bubble (slides in from left) */}
        <motion.div
          initial={{ x: -32, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' as const }}
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: '#fff',
            border: '1.5px solid rgba(148,163,184,0.35)',
            borderRadius: 999,
            padding: '10px 18px',
            background: 'rgba(255,255,255,0.05)',
            maxWidth: 220,
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#8b98a8', fontSize: 10 }}>user says</span>
          <br />
          "noise cancelling headphones under $100"
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ duration: 1.2, delay: 0.6 }}
          style={{ fontFamily: MONO, fontSize: 18, color: accent }}
        >
          →
        </motion.div>

        {/* LLM translation box */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9, ease: 'easeOut' as const }}
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: accent,
            border: `1.5px solid ${accent}60`,
            borderRadius: 8,
            padding: '8px 12px',
            background: `${accent}0d`,
            textAlign: 'center',
          }}
        >
          LLM (pruned schema)
          <br />
          <span style={{ color: '#8b98a8' }}>id · title · query · category</span>
          <br />
          <span style={{ color: '#8b98a8' }}>price · badge · fair_price</span>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ duration: 1.2, delay: 1.3 }}
          style={{ fontFamily: MONO, fontSize: 18, color: accent }}
        >
          →
        </motion.div>

        {/* SQL card (slides in from right) */}
        <motion.div
          initial={{ x: 32, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.5, ease: 'easeOut' as const }}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: '#e6edf3',
            border: '1px solid rgba(148,163,184,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            background: 'rgba(13,17,23,0.7)',
            maxWidth: 280,
            whiteSpace: 'pre',
            lineHeight: 1.65,
          }}
        >
          <span style={{ color: '#79c0ff' }}>SELECT</span> id, title, price,{'\n'}
          {'       '}badge, fair_price{'\n'}
          <span style={{ color: '#79c0ff' }}>FROM</span>   listings{'\n'}
          <span style={{ color: '#79c0ff' }}>WHERE</span>  query = <span style={{ color: '#a5d6ff' }}>&apos;noise cancelling headphones&apos;</span>{'\n'}
          {'  AND  '}price <span style={{ color: '#ff7b72' }}>&lt;</span> <span style={{ color: '#f2cc60' }}>100</span>{'\n'}
          <span style={{ color: '#79c0ff' }}>ORDER</span>  <span style={{ color: '#79c0ff' }}>BY</span> price <span style={{ color: '#79c0ff' }}>ASC</span>;
        </motion.div>
      </div>

      {/* Result table (fades up from center-bottom) */}
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.1, ease: 'easeOut' as const }}
        style={{ overflowX: 'auto' }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: MONO,
            fontSize: 11,
          }}
        >
          <thead>
            <tr>
              {['title', 'price', 'badge', 'fair_price'].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    padding: '5px 10px',
                    borderBottom: '1px solid rgba(148,163,184,0.2)',
                    color: accent,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '0.06em',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.title}>
                <td style={{ padding: '6px 10px', color: '#e6edf3', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>{row.title}</td>
                <td style={{ padding: '6px 10px', color: '#e6edf3', borderBottom: '1px solid rgba(148,163,184,0.08)', fontWeight: 700 }}>{row.price}</td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                  <span
                    style={{
                      color: row.badgeColor,
                      border: `1px solid ${row.badgeColor}60`,
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {row.badge}
                  </span>
                </td>
                <td style={{ padding: '6px 10px', color: '#8b98a8', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>{row.fair}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 12, textAlign: 'center' }}>
        The LLM sees only a pruned 7-column schema — internal fields (image_url, source) are withheld to prevent schema leakage.
        Two rows return; badge and fair_price columns are highlighted because they drive the next reasoning step.
      </div>
    </div>
  );
}
