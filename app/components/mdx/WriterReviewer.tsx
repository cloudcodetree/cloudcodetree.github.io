'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the writer/reviewer pattern (orchestrate.py).
 * Real adversarial GT (frozen snapshot): a writer recommends the $46 Bose QC45
 * (SUSPICIOUS trap) as "best value"; an isolated reviewer re-retrieves and fails
 * two checks; the orchestrator revises to the grounded Anker $44.99 answer.
 * Static/hydration-safe (transform/opacity on <div>s).
 */

const GREEN = '#3fb950';
const RED = '#f85149';
const OVER = '#8b98a8';

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10.5, color: ok ? GREEN : RED, display: 'flex', gap: 6 }}>
      <span>{ok ? '✓' : '✗'}</span><span style={{ color: '#cdd7e2' }}>{label}</span>
    </div>
  );
}

function Panel({ children, tone }: { children: React.ReactNode; tone: 'writer' | 'pass' | 'fail' }) {
  const border = tone === 'fail' ? `${RED}55` : tone === 'pass' ? `${GREEN}55` : 'rgba(148,163,184,0.2)';
  const bg = tone === 'fail' ? 'rgba(248,81,73,0.06)' : tone === 'pass' ? 'rgba(63,185,80,0.07)' : 'rgba(148,163,184,0.04)';
  return (
    <div style={{ flex: '1 1 210px', minWidth: 205, padding: '11px 12px', borderRadius: 9, border: `1px solid ${border}`, background: bg }}>
      {children}
    </div>
  );
}

export default function WriterReviewer({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 14 }}>
        Writer / reviewer — one agent can&apos;t check its own work
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {/* Writer */}
        <motion.div style={{ flex: '1 1 210px', minWidth: 205 }} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }}>
          <Panel tone="writer">
            <div style={{ fontFamily: MONO, fontSize: 10, color: OVER, marginBottom: 5 }}>writer (context A)</div>
            <div style={{ fontFamily: MONO, fontSize: 11.5, color: '#cdd7e2', lineHeight: 1.6 }}>
              &ldquo;Best value: <b style={{ color: '#fff' }}>Bose QuietComfort 45</b> at <b style={{ color: RED }}>$46.00</b> — an incredible deal.&rdquo;
            </div>
          </Panel>
        </motion.div>

        {/* Reviewer */}
        <motion.div style={{ flex: '1 1 210px', minWidth: 205 }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.25 }}>
          <Panel tone="fail">
            <div style={{ fontFamily: MONO, fontSize: 10, color: OVER, marginBottom: 5 }}>reviewer (context B — isolated, re-retrieves)</div>
            <Check label="grounded — prices are real" ok={true} />
            <Check label="lead is a DEAL, not a trap" ok={false} />
            <Check label="SUSPICIOUS trap warned" ok={false} />
            <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: RED, marginTop: 7 }}>✗ REJECTED</div>
          </Panel>
        </motion.div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 10, color: accent, textAlign: 'center', padding: '8px 0' }}>
        ↓ revise — fall back to the grounded deterministic answer
      </div>

      {/* Revised, approved */}
      <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: 0.4 }}>
        <Panel tone="pass">
          <div style={{ fontFamily: MONO, fontSize: 10, color: OVER, marginBottom: 5 }}>revised → re-reviewed</div>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: '#cdd7e2', lineHeight: 1.6 }}>
            &ldquo;Best value: <b style={{ color: '#fff' }}>Anker Soundcore Q20i</b> at <b style={{ color: GREEN }}>$44.99</b>… Avoid the Bose QC45 at $46.00 — SUSPICIOUS.&rdquo;
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: GREEN, marginTop: 7 }}>✓ APPROVED — grounded, lead is a DEAL, trap warned</div>
        </Panel>
      </motion.div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: OVER, marginTop: 12 }}>
        The reviewer has its own context and its own retrieval — it never sees the writer&apos;s reasoning. That isolation is what makes the second opinion worth having.
      </div>
    </div>
  );
}
