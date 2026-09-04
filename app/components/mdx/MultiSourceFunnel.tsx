'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the multi-source connector architecture for Part 7.
 * Visual metaphor: three differently-shaped source bubbles (diamond = eBay,
 * circle = Google Shopping/RapidAPI, pentagon = BestBuy) each emit a raw JSON
 * blob with a distinct field shape. All three feed into a single normalize()
 * funnel and emerge as identical RawListing rectangles.
 *
 * Concept made visible: one uniform schema, many heterogeneous source shapes.
 *
 * Distinct shapes used here:
 *   - Diamond (eBay) — rotated square
 *   - Circle (RapidAPI Google Shopping)
 *   - Pentagon (BestBuy)
 * None of these shapes appear elsewhere in the animation library.
 *
 * Static-export-safe: all text is in the DOM; no runtime fetch.
 */

const BLUE = '#94bce3';
const GREEN = '#94bce3';
const ORANGE = '#d29922';
const PURPLE = '#a371f7';

interface SourceBubbleProps {
  label: string;
  authLabel: string;
  rawFields: string[];
  color: string;
  shape: 'diamond' | 'circle' | 'pentagon';
  delay: number;
}

function Diamond({ size = 56, color }: { size?: number; color: string }) {
  const h = size / 2;
  return (
    <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      <rect
        x={h * 0.15}
        y={h * 0.15}
        width={size * 0.7}
        height={size * 0.7}
        transform={`rotate(45 ${h} ${h})`}
        fill={`${color}18`}
        stroke={color}
        strokeWidth={1.5}
      />
    </svg>
  );
}

function Pentagon({ size = 56, color }: { size?: number; color: string }) {
  const r = size / 2;
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (2 * Math.PI * i) / 5 - Math.PI / 2;
    return `${r + (r - 2) * Math.cos(a)},${r + (r - 2) * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      <polygon points={pts} fill={`${color}18`} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

function SourceBubble({ label, authLabel, rawFields, color, shape, delay }: SourceBubbleProps) {
  const ShapeNode = () => {
    if (shape === 'diamond') return <Diamond size={52} color={color} />;
    if (shape === 'pentagon') return <Pentagon size={52} color={color} />;
    // circle
    return (
      <svg width={52} height={52} style={{ display: 'block', overflow: 'visible' }}>
        <circle cx={26} cy={26} r={24} fill={`${color}18`} stroke={color} strokeWidth={1.5} />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay, duration: 0.45 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '1 1 120px', minWidth: 100 }}
    >
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <ShapeNode />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: MONO, fontSize: 9, color, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
        }}>
          {label}
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', textAlign: 'center' }}>{authLabel}</div>
      {/* raw JSON fragment */}
      <div style={{
        fontFamily: MONO, fontSize: 9, border: `1px solid ${color}33`, borderRadius: 6, padding: '5px 8px',
        background: `${color}08`, color: '#8b98a8', lineHeight: 1.6, width: '100%', maxWidth: 130,
      }}>
        {rawFields.map((f) => (
          <div key={f}>{f}</div>
        ))}
      </div>
    </motion.div>
  );
}

export default function MultiSourceFunnel({ accent = ACCENT }: { accent?: string }) {
  const sources: SourceBubbleProps[] = [
    {
      label: 'eBay',
      authLabel: 'OAuth 2.0',
      rawFields: ['itemId: "v1|271…"', 'price.value: 159.99', 'condition: "New"', 'image.imageUrl'],
      color: BLUE,
      shape: 'diamond',
      delay: 0.1,
    },
    {
      label: 'Google\nShopping',
      authLabel: 'RapidAPI key',
      rawFields: ['product_id: "…"', 'price: "$162.97"', 'store_name: "Costco"', 'product_photos[0]'],
      color: GREEN,
      shape: 'circle',
      delay: 0.2,
    },
    {
      label: 'BestBuy',
      authLabel: 'apiKey param',
      rawFields: ['sku: 6505727', 'salePrice: 199.99', 'manufacturer: "Sony"', 'url: "bestbuy.com…"'],
      color: ORANGE,
      shape: 'pentagon',
      delay: 0.3,
    },
  ];

  return (
    <div style={{
      border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px',
      margin: '24px 0', background: 'rgba(13,17,23,0.4)',
    }}>
      <div style={{
        fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: accent, marginBottom: 20,
      }}>
        Many source shapes → one schema
      </div>

      {/* source row */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        {sources.map((s) => (
          <SourceBubble key={s.label} {...s} />
        ))}
      </div>

      {/* converging arrows */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 8 }}
      >
        {[BLUE, GREEN, ORANGE].map((c, i) => (
          <motion.div
            key={i}
            style={{ fontFamily: MONO, fontSize: 18, color: c }}
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.4, delay: i * 0.15, repeat: Infinity }}
          >
            ↓
          </motion.div>
        ))}
      </motion.div>

      {/* normalize() funnel */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.85 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ delay: 0.6, duration: 0.45 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${PURPLE}14`, border: `1px solid ${PURPLE}50`,
          borderRadius: 10, padding: '10px 20px', margin: '0 auto 16px',
          maxWidth: 320, fontFamily: MONO, fontSize: 12, color: PURPLE, fontWeight: 700,
        }}
      >
        normalize() → validate_listing()
      </motion.div>

      {/* output: uniform RawListing rows */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ delay: 0.8, duration: 0.45 }}
        style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}
      >
        {[
          { src: 'ebay', color: BLUE },
          { src: 'google_shopping', color: GREEN },
          { src: 'bestbuy', color: ORANGE },
        ].map(({ src, color }) => (
          <div key={src} style={{
            fontFamily: MONO, fontSize: 9, border: `1px solid ${color}50`, borderRadius: 7,
            padding: '6px 10px', background: `${color}0a`, color: '#e3e8f0', lineHeight: 1.7,
            flex: '1 1 140px', maxWidth: 180,
          }}>
            <div style={{ color, fontWeight: 700, marginBottom: 2 }}>RawListing</div>
            <div><span style={{ color: '#8b98a8' }}>source:</span> "{src}"</div>
            <div><span style={{ color: '#8b98a8' }}>price:</span> <span style={{ color: GREEN }}>float</span></div>
            <div><span style={{ color: '#8b98a8' }}>currency:</span> "USD"</div>
            <div><span style={{ color: '#8b98a8' }}>deal_pct:</span> null</div>
          </div>
        ))}
      </motion.div>

      <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 10, color: '#8b98a8', textAlign: 'center' }}>
        <span style={{ color: accent }}>deal_pct</span> is null at ingestion — the aggregator (Part 9) fills it after cross-source merging.
      </div>
    </div>
  );
}
