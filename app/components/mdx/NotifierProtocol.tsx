'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * NotifierProtocol — bespoke animation for Part 29 (Saved searches & the suggestions worker).
 *
 * Metaphor: a protocol seam / swap diagram. Three delivery targets (Console,
 * Email, Push) branch off a single Notifier protocol node. The ConsoleNotifier
 * fires during tests (green); the real-world channels are greyed out as
 * "swap in production" — visualizing why the delivery seam is a Protocol rather
 * than a concrete class. The animation plays a pulse from the source through the
 * protocol node and down each branch sequentially, with Console lighting up and
 * the others remaining dim.
 *
 * Static-export-safe: all text is in the DOM; no runtime data fetch.
 */

const BRANCHES = [
  {
    id: 'console',
    label: 'ConsoleNotifier',
    sublabel: 'default · tests · inspection',
    active: true,
    color: '#3fb950',
  },
  {
    id: 'email',
    label: 'EmailNotifier',
    sublabel: 'swap in production',
    active: false,
    color: '#58a6ff',
  },
  {
    id: 'push',
    label: 'PushNotifier',
    sublabel: 'swap in production',
    active: false,
    color: '#58a6ff',
  },
];

function Branch({
  branch,
  delay,
  accent,
}: {
  branch: (typeof BRANCHES)[0];
  delay: number;
  accent: string;
}) {
  const col = branch.active ? branch.color : 'rgba(148,163,184,0.28)';
  const textCol = branch.active ? '#cdd7e2' : '#596070';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* connector line */}
      <motion.div
        initial={{ height: 0 }}
        whileInView={{ height: 28 }}
        viewport={{ amount: 0.3 }}
        transition={{ delay, duration: 0.25 }}
        style={{ width: 2, background: col, borderRadius: 1 }}
      />
      {/* node */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ amount: 0.3 }}
        transition={{ delay: delay + 0.25, type: 'spring', stiffness: 260 }}
        style={{
          border: `1.5px solid ${col}`,
          borderRadius: 9,
          padding: '8px 14px',
          fontFamily: MONO,
          fontSize: 11,
          color: textCol,
          background: branch.active ? `${branch.color}16` : 'rgba(13,17,23,0.2)',
          textAlign: 'center' as const,
          minWidth: 130,
          position: 'relative',
        }}
      >
        {branch.active && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 8,
              border: `1px solid ${branch.color}`,
              pointerEvents: 'none',
            }}
            animate={{ opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: delay + 0.5 }}
          />
        )}
        <div style={{ fontWeight: 700 }}>{branch.label}</div>
        <div style={{ fontSize: 9, color: branch.active ? '#8b98a8' : '#3a4050', marginTop: 2 }}>
          {branch.sublabel}
        </div>
      </motion.div>
    </div>
  );
}

export default function NotifierProtocol({ accent = ACCENT }: { accent?: string }) {
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
          textTransform: 'uppercase' as const,
          color: accent,
          marginBottom: 4,
        }}
      >
        Notifier protocol — delivery seam
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 20 }}>
        run_suggestions() calls notifier.notify() — swap the implementation, not the logic
      </div>

      {/* source */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            border: `1.5px solid ${accent}`,
            borderRadius: 9,
            padding: '8px 18px',
            color: '#cdd7e2',
            background: `${accent}14`,
            marginBottom: 0,
          }}
        >
          <span style={{ color: accent, fontWeight: 700 }}>Notification</span>
          {' '}→{' '}
          <span style={{ fontWeight: 700 }}>Notifier</span>
          <span style={{ color: '#596070' }}>.notify()</span>
        </motion.div>

        {/* trunk line */}
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: 20 }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          style={{ width: 2, background: `${accent}80`, borderRadius: 1 }}
        />

        {/* protocol node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 240 }}
          style={{
            fontFamily: MONO,
            fontSize: 11,
            border: `1.5px dashed ${accent}80`,
            borderRadius: 9,
            padding: '7px 16px',
            color: '#8b98a8',
            background: 'rgba(63,185,80,0.06)',
            marginBottom: 0,
          }}
        >
          <span style={{ fontWeight: 700, color: accent }}>Protocol</span>
          {' '}(runtime_checkable)
        </motion.div>

        {/* fan-out bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ amount: 0.3 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          style={{
            width: '78%',
            height: 2,
            background: `linear-gradient(90deg, #3fb950 0%, ${accent}55 50%, #58a6ff 100%)`,
            borderRadius: 1,
            marginTop: 0,
            transformOrigin: 'center',
          }}
        />

        {/* branches */}
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' as const, width: '100%', marginTop: 0 }}>
          {BRANCHES.map((b, i) => (
            <Branch key={b.id} branch={b} delay={0.65 + i * 0.15} accent={accent} />
          ))}
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#596070', marginTop: 18 }}>
        <span style={{ color: '#3fb950' }}>ConsoleNotifier</span> is the default — .sent keeps the payload list for tests.
        {' '}Email/push slots in without touching run_suggestions().
      </div>
    </div>
  );
}
