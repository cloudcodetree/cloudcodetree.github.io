'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of the Terraform-managed local stack:
 * two Docker containers (pgvector DB + DealFinder app) on a shared
 * virtual network, with the DB port bound to loopback only.
 * Static-safe. No runtime data fetch.
 */

const NODES = [
  {
    id: 'db',
    label: 'dealfinder-db',
    sub: 'pgvector/pgvector:pg16',
    port: ':5433 → 127.0.0.1',
    color: '#58a6ff',
  },
  {
    id: 'app',
    label: 'dealfinder-app',
    sub: 'dealfinder-app:local',
    port: ':8000 → 127.0.0.1',
    color: ACCENT,
  },
];

export default function TerraformStack({ accent = ACCENT }: { accent?: string }) {
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
        tofu apply — two containers, one network
      </div>

      {/* network wrapper */}
      <div
        style={{
          border: '1px dashed rgba(148,163,184,0.28)',
          borderRadius: 10,
          padding: '14px 12px',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9,
            color: '#8b98a8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          dealfinder-net (Docker network)
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {NODES.map((n, i) => (
            <motion.div
              key={n.id}
              style={{
                flex: '1 1 180px',
                border: `1px solid ${n.color}59`,
                background: `${n.color}0d`,
                borderRadius: 9,
                padding: '12px 14px',
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.3 }}
              transition={{ delay: i * 0.18 }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#e6edf3',
                }}
              >
                {n.label}
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  color: '#8b98a8',
                  marginTop: 3,
                }}
              >
                {n.sub}
              </div>
              <motion.div
                style={{
                  marginTop: 8,
                  fontFamily: MONO,
                  fontSize: 10,
                  color: n.color,
                  border: `1px solid ${n.color}40`,
                  borderRadius: 5,
                  padding: '3px 6px',
                  display: 'inline-block',
                }}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.4 }}
              >
                {n.port}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* connection arrow between db and app */}
        <motion.div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            color: '#8b98a8',
            marginTop: 12,
            textAlign: 'center',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: 0.5 }}
        >
          app → db via{' '}
          <span style={{ color: '#58a6ff' }}>container name</span> (no hard-coded IP)
        </motion.div>
      </div>

      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: '#8b98a8',
          marginTop: 14,
        }}
      >
        DB port 5432 bound to{' '}
        <span style={{ color: '#f85149' }}>127.0.0.1 only</span>
        {' '}— never exposed on the network. App resolves the DB by container name over the shared Docker network.
      </div>
    </div>
  );
}
