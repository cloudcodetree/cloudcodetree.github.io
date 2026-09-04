'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of why you'd fine-tune for a narrow task: a small
 * fine-tuned model can beat a bigger prompted base on YOUR task while being
 * cheaper and faster. Paired bars (base vs fine-tuned) across three measures.
 * Numbers are illustrative (this is an anchored/GPU part); the shape is the
 * point. Static-safe.
 */

type Row = { label: string; base: number; ft: number; unit: string; higherBetter: boolean; baseTxt: string; ftTxt: string };

const ROWS: Row[] = [
  { label: 'extraction accuracy', base: 82, ft: 94, unit: '%', higherBetter: true, baseTxt: '82%', ftTxt: '94%' },
  { label: 'cost / 1k listings', base: 100, ft: 18, unit: '%', higherBetter: false, baseTxt: '$0.90', ftTxt: '$0.16' },
  { label: 'latency / call', base: 100, ft: 35, unit: '%', higherBetter: false, baseTxt: '900ms', ftTxt: '310ms' },
];

export default function FineTuneGain({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 4 }}>
        Fine-tuned small vs prompted base
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 16 }}>
        on the narrow extraction task (illustrative)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ROWS.map((r, i) => (
          <div key={r.label}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', marginBottom: 5 }}>{r.label}</div>
            {[['base', r.base, r.baseTxt, '#8b98a8'], ['fine-tuned', r.ft, r.ftTxt, accent]].map(([name, val, txt, col]) => (
              <div key={name as string} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', width: 72, flex: '0 0 auto' }}>{name}</span>
                <div style={{ flex: 1, height: 13, background: 'rgba(148,163,184,0.07)', borderRadius: 4, overflow: 'hidden', maxWidth: 320 }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 4, background: col as string }}
                    initial={{ width: 0 }} whileInView={{ width: `${val as number}%` }} viewport={{ amount: 0.4 }} transition={{ delay: 0.2 + i * 0.15, duration: 0.7 }}
                  />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: col as string, width: 56, flex: '0 0 auto' }}>{txt}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        Fine-tuning trades a one-time training cost for a model that&apos;s <span style={{ color: accent }}>more accurate, cheaper, and faster</span> on the one job you need.
      </div>
    </div>
  );
}
