import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import type { SearchMiss } from '../../components/admin/AnalyticsDashboard';
import { parseMisses } from '../../../scripts/lib/search-misses.mjs';

export const metadata: Metadata = {
  title: 'Demo analytics · CloudCodeTree',
  robots: { index: false, follow: false },
};

const MISSES_SHOWN = 25;

// Zero-result searches, harvested into a committed file by
// scripts/harvest-search-misses.mjs and read here at build time — no endpoint,
// no credential, no client fetch. Absent or unreadable means "no misses yet".
function readMisses(): SearchMiss[] {
  const file = path.join(process.cwd(), 'content', 'search-misses.jsonl');
  if (!fs.existsSync(file)) return [];
  try {
    const rows: SearchMiss[] = parseMisses(fs.readFileSync(file, 'utf8'));
    return rows.sort((a, b) => (a.first_seen < b.first_seen ? 1 : a.first_seen > b.first_seen ? -1 : 0)).slice(0, MISSES_SHOWN);
  } catch { return []; }
}

// Prerendered shell; every Supabase number is fetched client-side as the
// signed-in owner through owner_analytics(), which refuses anyone else at the
// database. The search misses are the exception: they are baked in.
export default function AdminAnalyticsPage() {
  return <AnalyticsDashboard misses={readMisses()} />;
}
