'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for DataSubjectStore GDPR export + delete (Part 31).
 *
 * Metaphor: a vertical ledger of records in a store (two rows for u1,
 * one for u2). Two operations animate in sequence: EXPORT (the two u1
 * records are highlighted and copied out as a SAR package) and DELETE
 * (the u1 rows are struck through and removed; u2 is untouched). After
 * each operation an audit-log entry appears to the right. The shape is a
 * ledger-and-receipt pair — completely distinct from InjectionShield's
 * pass/block lanes and SlidingWindowClock's timeline tokens.
 *
 * All numbers are from the ground-truth run:
 *   export('u1') → 2 records  →  audit: gdpr_export, count=2
 *   delete('u1') → 2 removed  →  audit: gdpr_delete, count=2
 *   count('u2') after delete  → 1  (untouched)
 *
 * Static-export-safe: Framer Motion, no runtime fetch.
 */

type Record_ = { id: string; user: string; data: string; deleted?: boolean };

const RECORDS: Record_[] = [
  { id: 'r1', user: 'u1', data: "saved_search: 'noise cancelling headphones'" },
  { id: 'r2', user: 'u1', data: "saved_search: 'external ssd 1tb'" },
  { id: 'r3', user: 'u2', data: "saved_search: 'gaming keyboard'" },
];

type AuditEntry = { action: string; user: string; count: number; color: string };

const AUDIT_ENTRIES: AuditEntry[] = [
  { action: 'gdpr_export', user: 'u1', count: 2, color: '#58a6ff' },
  { action: 'gdpr_delete', user: 'u1', count: 2, color: '#f85149' },
];

function RecordRow({
  rec,
  index,
  accent,
}: {
  rec: Record_;
  index: number;
  accent: string;
}) {
  const isU1 = rec.user === 'u1';
  const rowAccent = isU1 ? accent : '#8b98a8';

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 6,
        border: `1px solid ${rowAccent}33`,
        background: `${rowAccent}0a`,
        flexWrap: 'wrap',
      }}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ amount: 0.3 }}
      transition={{ delay: 0.08 + index * 0.15, type: 'spring', stiffness: 240, damping: 22 }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: rowAccent,
          fontWeight: 700,
          flexShrink: 0,
          width: 20,
        }}
      >
        {rec.user}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: '#cdd7e2', flex: 1 }}>
        {rec.data}
      </span>
    </motion.div>
  );
}

function AuditRow({ entry, index }: { entry: AuditEntry; index: number }) {
  return (
    <motion.div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        padding: '5px 8px',
        borderRadius: 6,
        border: `1px solid ${entry.color}33`,
        background: `${entry.color}0c`,
        flexWrap: 'wrap',
      }}
      initial={{ opacity: 0, x: 10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ amount: 0.3 }}
      transition={{ delay: 0.6 + index * 0.3, type: 'spring', stiffness: 200, damping: 20 }}
    >
      <motion.span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: entry.color,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.4 }}
      >
        {entry.action}
      </motion.span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', whiteSpace: 'nowrap' }}>
        user_id={entry.user} · count={entry.count}
      </span>
    </motion.div>
  );
}

export default function GDPRAuditTrail({ accent = ACCENT }: { accent?: string }) {
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
      {/* header */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 4,
        }}
      >
        DataSubjectStore — export → delete → audit
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        u1 holds 2 records · u2 holds 1 · every operation writes to Part 21 AuditLog
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* left: the store */}
        <div style={{ flex: '1 1 180px', minWidth: 180 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: accent,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Store records
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RECORDS.map((rec, i) => (
              <RecordRow key={rec.id} rec={rec} index={i} accent={accent} />
            ))}
          </div>

          {/* u1 deleted indicator */}
          <motion.div
            style={{
              marginTop: 10,
              fontFamily: MONO,
              fontSize: 10,
              color: '#f85149',
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: 1.0 }}
          >
            ✕ u1 erased · u2 untouched (count=1)
          </motion.div>
        </div>

        {/* divider */}
        <div
          style={{
            width: 1,
            background: 'rgba(148,163,184,0.12)',
            alignSelf: 'stretch',
            flexShrink: 0,
          }}
        />

        {/* right: audit log */}
        <div style={{ flex: '1 1 180px', minWidth: 180 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: accent,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            AuditLog (Part 21)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {AUDIT_ENTRIES.map((entry, i) => (
              <AuditRow key={entry.action} entry={entry} index={i} />
            ))}
          </div>

          <motion.div
            style={{
              marginTop: 12,
              fontFamily: MONO,
              fontSize: 10,
              color: '#8b98a8',
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.3 }}
            transition={{ delay: 1.3 }}
          >
            isinstance(store.audit, AuditLog){' '}
            <span style={{ color: '#94bce3' }}>True</span>
          </motion.div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        <span style={{ color: accent }}>export</span> returns copies (SAR) and audits.{' '}
        <span style={{ color: '#f85149' }}>delete</span> erases and audits. Both reuse the
        same AuditLog instance imported from Part 21 — no reimplementation.
      </div>
    </div>
  );
}
