'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * HmacVerify — how a shared-secret signature proves a payload wasn't tampered
 * with. Same mechanism behind JWT HS256 (P32) and Stripe webhooks (P34): the
 * receiver recomputes HMAC(payload, secret) and compares. A forged payload
 * produces a different fingerprint → reject. Static/hydration-safe.
 */

const GREEN = '#3fb950';
const RED = '#f85149';
const MUT = '#8b98a8';
const MONOF = MONO;

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ fontFamily: MONOF, fontSize: 11, display: 'flex', gap: 6 }}>
      <span style={{ color: MUT, minWidth: 96 }}>{label}</span>
      <span style={{ color: color || '#cdd7e2', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function Scenario({
  tone, heading, payload, recomputed, sent, verdict, accent,
}: { tone: 'pass' | 'fail'; heading: string; payload: string; recomputed: string; sent: string; verdict: string; accent: string }) {
  const ok = tone === 'pass';
  const c = ok ? GREEN : RED;
  return (
    <div style={{ flex: '1 1 250px', minWidth: 240, padding: '12px 13px', borderRadius: 9, border: `1px solid ${c}55`, background: ok ? 'rgba(63,185,80,0.06)' : 'rgba(248,81,73,0.06)' }}>
      <div style={{ fontFamily: MONOF, fontSize: 10, color: MUT, marginBottom: 6 }}>{heading}</div>
      <Row label="payload" value={payload} color={ok ? '#cdd7e2' : RED} />
      <div style={{ margin: '6px 0', paddingLeft: 8, borderLeft: `2px solid ${accent}55` }}>
        <div style={{ fontFamily: MONOF, fontSize: 10, color: accent }}>↳ recompute HMAC(payload, secret):</div>
        <Row label="you compute" value={recomputed} color={ok ? GREEN : c} />
        <Row label="they sent" value={sent} color={MUT} />
      </div>
      <div style={{ fontFamily: MONOF, fontSize: 11, fontWeight: 700, color: c, marginTop: 4 }}>
        {ok ? '✓' : '✗'} {ok ? 'match' : 'mismatch'} → {verdict}
      </div>
    </div>
  );
}

export default function HmacVerify({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONOF, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        HMAC verification — recompute the fingerprint, compare
      </div>
      <div style={{ fontFamily: MONOF, fontSize: 11, color: MUT, marginBottom: 14 }}>
        both sides hold the same <b style={{ color: accent }}>secret</b>; the signature is <code>HMAC-SHA256(payload, secret)</code>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <motion.div style={{ flex: '1 1 250px', minWidth: 240 }} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }}>
          <Scenario tone="pass" heading="genuine request" payload="amount=44.99" recomputed="a3f8c1…" sent="a3f8c1…" verdict="accept" accent={accent} />
        </motion.div>
        <motion.div style={{ flex: '1 1 250px', minWidth: 240 }} initial={{ opacity: 0, x: 6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.3 }} transition={{ delay: 0.12 }}>
          <Scenario tone="fail" heading="attacker changed the payload" payload="amount=4.99" recomputed="b1c290…" sent="a3f8c1…" verdict="reject (400 / 401)" accent={accent} />
        </motion.div>
      </div>

      <div style={{ fontFamily: MONOF, fontSize: 11, color: MUT, marginTop: 14, lineHeight: 1.6 }}>
        The signature is a fingerprint only someone holding the <b style={{ color: accent }}>secret</b> can produce. The receiver recomputes it over the payload it actually received and compares. Change one byte of the payload and the fingerprint changes <i>completely</i> — so a forged payload can never carry a matching signature. That is why a tampered request is rejected without any database lookup or network call.
        {' '}<b style={{ color: '#cdd7e2' }}>JWT (HS256)</b> signs <code>header.payload</code>; a <b style={{ color: '#cdd7e2' }}>Stripe webhook</b> signs <code>timestamp.body</code> — same mechanism, different payload.
      </div>
    </div>
  );
}
