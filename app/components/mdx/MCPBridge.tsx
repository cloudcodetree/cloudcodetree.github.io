'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration of MCP as a standard port: many clients speak one protocol
 * to your server, so you write the tools once and any client can call them. A
 * request token crosses the MCP bar to the server and a result returns.
 * Static-safe.
 */

const CLIENTS = ['Claude Code', 'Claude Desktop', 'any MCP client'];
const TOOLS = ['score_deal', 'recommend', 'search_deals'];

export default function MCPBridge({ accent = ACCENT }: { accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 14, padding: '20px 18px', margin: '24px 0', background: 'rgba(13,17,23,0.4)' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 16 }}>
        One protocol, many clients
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
          {CLIENTS.map((c, i) => (
            <motion.div
              key={c}
              style={{ fontFamily: MONO, fontSize: 11, color: '#cdd7e2', border: '1px solid rgba(148,163,184,0.22)', borderRadius: 7, padding: '6px 10px' }}
              initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ amount: 0.4 }} transition={{ delay: i * 0.1 }}
            >{c}</motion.div>
          ))}
        </div>

        {/* MCP port + traveling request */}
        <div style={{ position: 'relative', flex: '1 1 90px', minWidth: 80, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: `${accent}59`, transform: 'translateX(-50%)' }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: accent, background: 'rgba(13,17,23,0.9)', padding: '3px 6px', zIndex: 1 }}>MCP</span>
          <motion.span
            style={{ position: 'absolute', top: '50%', width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: -4 }}
            animate={{ left: ['0%', '100%', '0%'], opacity: [1, 1, 0.3, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
          />
        </div>

        {/* server */}
        <div style={{ flex: '1 1 180px', minWidth: 170, border: `1.5px solid ${accent}73`, background: `${accent}10`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>DealFinder server</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {TOOLS.map((t) => (
              <span key={t} style={{ fontFamily: MONO, fontSize: 10, color: accent, border: `1px solid ${accent}59`, borderRadius: 5, padding: '3px 6px' }}>{t}()</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 14 }}>
        Write the tools <span style={{ color: accent }}>once</span>; every MCP-speaking client can call them — no per-client glue.
      </div>
    </div>
  );
}
