'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of how secrets flow from an external secrets manager
 * through a Kubernetes Secret into the pod environment — without ever
 * touching a committed YAML file.
 *
 * The two paths shown:
 *   Manual (dev/learning): cp secret.example.yaml → edit → kubectl apply
 *   Production:            ESO / SOPS / Sealed Secrets → K8s Secret → envFrom → pod
 *
 * Static-export-safe. No runtime data fetch. Framer Motion only.
 */

const KEYS = [
  'DATABASE_URL',
  'SUPABASE_JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'RAPIDAPI_KEY',
];

// ── colour tokens ────────────────────────────────────────────────────────────
const RED = '#f85149';
const GREEN = '#94bce3';
const BLUE = '#58a6ff';

export default function SecretFlow({ accent = ACCENT }: { accent?: string }) {
  const [step, setStep] = useState(0);
  // 0 = vault sits at rest; 1 = K8s Secret created; 2 = pod receives envFrom
  const STEPS = 3;

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS), 2800);
    return () => clearInterval(id);
  }, []);

  const vaultActive = step >= 0;
  const secretActive = step >= 1;
  const podActive = step >= 2;

  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 14,
        padding: '20px 18px',
        margin: '24px 0',
        background: 'rgba(13,17,23,0.4)',
        overflowX: 'auto',
      }}
    >
      {/* header */}
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
        secrets flow — vault → k8s Secret → envFrom → pod
      </div>

      {/* pipeline row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* ── vault / secrets manager ── */}
        <motion.div
          style={{
            flex: '0 0 auto',
            minWidth: 120,
            border: `1.5px solid ${vaultActive ? BLUE : 'rgba(148,163,184,0.2)'}`,
            background: vaultActive ? `${BLUE}12` : 'transparent',
            borderRadius: 9,
            padding: '12px 12px',
            transition: 'border-color 0.4s, background 0.4s',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#e6edf3' }}>
            secrets manager
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 2 }}>
            ESO / SOPS / Sealed Secrets
          </div>
          <div style={{ marginTop: 8 }}>
            {KEYS.map((k) => (
              <div key={k} style={{ fontFamily: MONO, fontSize: 8, color: BLUE, lineHeight: '1.6' }}>
                {k}: ●●●●●●
              </div>
            ))}
          </div>
        </motion.div>

        {/* arrow 1 */}
        <motion.div
          style={{ fontFamily: MONO, fontSize: 16, color: secretActive ? accent : '#444' }}
          animate={{ x: secretActive ? [0, 4, 0] : 0 }}
          transition={{ duration: 0.6, repeat: secretActive ? Infinity : 0 }}
        >
          →
        </motion.div>

        {/* ── k8s Secret ── */}
        <motion.div
          style={{
            flex: '0 0 auto',
            minWidth: 120,
            border: `1.5px solid ${secretActive ? accent : 'rgba(148,163,184,0.2)'}`,
            background: secretActive ? `${accent}12` : 'transparent',
            borderRadius: 9,
            padding: '12px 12px',
            transition: 'border-color 0.4s, background 0.4s',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#e6edf3' }}>
            dealfinder-secrets
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 2 }}>
            kind: Secret · Opaque
          </div>
          <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 9, color: '#8b98a8' }}>
            secret.example.yaml → fill → apply
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: MONO,
              fontSize: 8,
              color: secretActive ? RED : '#444',
              transition: 'color 0.4s',
            }}
          >
            committed file: placeholders only
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 8,
              color: secretActive ? GREEN : '#444',
              transition: 'color 0.4s',
            }}
          >
            real secret.yaml: gitignored ✓
          </div>
        </motion.div>

        {/* arrow 2 */}
        <motion.div
          style={{ fontFamily: MONO, fontSize: 16, color: podActive ? accent : '#444' }}
          animate={{ x: podActive ? [0, 4, 0] : 0 }}
          transition={{ duration: 0.6, repeat: podActive ? Infinity : 0, delay: 0.15 }}
        >
          →
        </motion.div>

        {/* ── pod ── */}
        <motion.div
          style={{
            flex: '1 1 120px',
            minWidth: 120,
            border: `1.5px solid ${podActive ? GREEN : 'rgba(148,163,184,0.2)'}`,
            background: podActive ? `${GREEN}0d` : 'transparent',
            borderRadius: 9,
            padding: '12px 12px',
            transition: 'border-color 0.4s, background 0.4s',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#e6edf3' }}>
            dealfinder-app pod
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#8b98a8', marginTop: 2 }}>
            envFrom: secretRef
          </div>
          <div style={{ marginTop: 8 }}>
            {KEYS.map((k, i) => (
              <motion.div
                key={k}
                style={{ fontFamily: MONO, fontSize: 8, color: podActive ? GREEN : '#444', lineHeight: '1.6', transition: 'color 0.4s' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: podActive ? 1 : 0 }}
                transition={{ delay: i * 0.07 }}
              >
                {k} ✓
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* footer note */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: '#8b98a8',
          marginTop: 14,
          borderTop: '1px solid rgba(148,163,184,0.1)',
          paddingTop: 10,
        }}
      >
        No real secret ever touches a committed file.{' '}
        <span style={{ color: RED }}>secret.example.yaml</span> holds placeholders only —
        copy, fill, <span style={{ color: GREEN }}>kubectl apply</span>, then delete the filled copy (or use ESO / Sealed Secrets in prod).
      </div>
    </div>
  );
}
