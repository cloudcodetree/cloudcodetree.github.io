'use client';

import { motion } from 'framer-motion';
import { MONO, ACCENT } from '../blogShared';

/**
 * Bespoke illustration for "scraping permission tiers" — the decision a
 * connector must make before issuing a request. Four sources appear in
 * DealFinder's live_sources.py; each lands in exactly one tier based on how
 * the data is obtained and whether a ToS / robots.txt gates it.
 *
 * Visual metaphor: a vertical traffic-light tower. Each tier is a ring that
 * illuminates when the animation enters view; the label, source example, and
 * permission badge are real text in the DOM so the lesson reads without JS.
 *
 * Tiers (authoritative from the companion):
 *   1 — Official API  (RapidAPI, BestBuy, eBay) — first-party endpoints,
 *       ToS explicitly permits programmatic access. Green ring.
 *   2 — Managed scraping (Apify actor) — operator runs the scraping;
 *       DealFinder calls a clean HTTP API. Yellow ring.
 *   3 — Public structured feed (ShopifySource /products.json) — keyless,
 *       documented by Shopify, indexed by search engines. Yellow ring.
 *   4 — Broad-web crawl (FirecrawlSource) — page-level HTML → escalate only
 *       when tiers 1-3 miss the retailer; check robots.txt before use. Red ring.
 *
 * Static-export-safe: no runtime data fetch; all content is compile-time const.
 */

type Tier = {
  level: number;
  label: string;
  examples: string;
  permission: string;
  color: string;
  badge: string;
};

const TIERS: Tier[] = [
  {
    level: 1,
    label: 'Official API',
    examples: 'RapidAPI · BestBuy · eBay Browse',
    permission: 'ToS explicitly permits programmatic access — first-party endpoint',
    color: '#94bce3',
    badge: 'ALLOWED',
  },
  {
    level: 2,
    label: 'Managed scraping',
    examples: 'Apify actor (Google Shopping)',
    permission: 'Apify operator handles the scraping; you call a clean HTTP API',
    color: '#d29922',
    badge: 'DELEGATED',
  },
  {
    level: 3,
    label: 'Public structured feed',
    examples: 'ShopifySource /products.json',
    permission: 'Shopify documents the feed; search engines index it — intentionally public',
    color: '#d29922',
    badge: 'PUBLIC FEED',
  },
  {
    level: 4,
    label: 'Broad-web crawl',
    examples: 'FirecrawlSource (page-level HTML)',
    permission: 'Check robots.txt and rate-limit aggressively — escalate only when tiers 1-3 miss the retailer',
    color: '#f85149',
    badge: 'CHECK FIRST',
  },
];

export default function ScrapingPermissionTiers({ accent = ACCENT }: { accent?: string }) {
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
          marginBottom: 4,
        }}
      >
        Source permission tiers — live_sources.py
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginBottom: 18 }}>
        pick the highest tier that covers the retailer — escalate only when needed
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIERS.map((tier, i) => (
          <motion.div
            key={tier.level}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              background: `${tier.color}09`,
              border: `1px solid ${tier.color}33`,
              borderRadius: 10,
              padding: '10px 14px',
            }}
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.35 }}
            transition={{ delay: i * 0.13, type: 'spring', stiffness: 240, damping: 22 }}
          >
            {/* traffic-light dot */}
            <motion.div
              style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: tier.color,
                marginTop: 2,
                boxShadow: `0 0 0 4px ${tier.color}28`,
              }}
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' as const, delay: i * 0.4 }}
            />

            {/* text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8' }}>
                  tier {tier.level}
                </span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#cdd7e2' }}>{tier.label}</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    fontWeight: 700,
                    color: tier.color,
                    border: `1px solid ${tier.color}55`,
                    borderRadius: 4,
                    padding: '1px 5px',
                    letterSpacing: '0.05em',
                  }}
                >
                  {tier.badge}
                </span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: accent, marginTop: 3 }}>
                {tier.examples}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: '#8b98a8', marginTop: 3 }}>
                {tier.permission}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11, color: '#8b98a8', marginTop: 16 }}>
        The companion orders sources by tier in{' '}
        <span style={{ color: accent }}>LIVE_SOURCES</span>: tier-1 connectors run first;
        FirecrawlSource is the last escalation. Robots.txt is checked in tests; see{' '}
        <span style={{ color: accent }}>test_scraper_source.py</span>.
      </div>
    </div>
  );
}
