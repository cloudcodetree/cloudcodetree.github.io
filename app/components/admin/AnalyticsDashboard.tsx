'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { supabase } from '../../lib/supabaseClient';
import { Corners, blueprintSx } from '../Blueprint';
import { ACCENT, ACCENT2, MONO, SERIF } from '../blogShared';

type Row = Record<string, string | number | boolean | null>;

interface Sections {
  signups: Row[];
  opens: Row[];
  recent: Row[];
}

/** One line of content/search-misses.jsonl, baked in by the server route. */
export interface SearchMiss {
  q: string;
  first_seen: string;
  count: number;
  /** Best similarity score before the relevance floor; absent on a cached miss. */
  top?: number;
}

type State =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'forbidden' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: Sections };

const SECTIONS: (keyof Sections)[] = ['signups', 'opens', 'recent'];

async function load(): Promise<State> {
  const client = supabase();
  const { data: sess } = await client.auth.getSession();
  if (!sess.session) return { kind: 'signed-out' };
  const out: Partial<Sections> = {};
  for (const section of SECTIONS) {
    const { data, error } = await client.rpc('owner_analytics', { section });
    if (error) {
      // 42501 = the database's own owner check said no.
      if (error.code === '42501' || /not an owner/i.test(error.message)) return { kind: 'forbidden' };
      return { kind: 'error', message: error.message };
    }
    out[section] = (data ?? []) as Row[];
  }
  return { kind: 'ready', data: out as Sections };
}

function fmt(v: Row[string]): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.replace('T', ' ').slice(0, 16) + ' UTC';
  return String(v);
}

function Section({ title, hint, rows, columns }: { title: string; hint: string; rows: Row[]; columns: string[] }) {
  return (
    <Box component="section" sx={{ ...blueprintSx, position: 'relative', p: { xs: 2, md: 3 }, mb: 4 }}>
      <Corners />
      <Typography component="h2" sx={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography sx={{ fontFamily: MONO, fontSize: '0.75rem', color: ACCENT, mb: 2, letterSpacing: '0.04em' }}>{hint}</Typography>
      {rows.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Nothing yet.</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ '& th, & td': { fontFamily: MONO, fontSize: '0.78rem', whiteSpace: 'nowrap', borderColor: 'rgba(148,188,227,0.18)' } }}>
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c} sx={{ color: ACCENT2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {c.replace(/_/g, ' ')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c} sx={{ color: 'text.primary' }}>
                      {fmt(r[c])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

export default function AnalyticsDashboard({ misses = [] }: { misses?: SearchMiss[] }) {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const run = () => void load().then((s) => { if (!cancelled) setState(s); });
    run();
    // Re-run after the site-wide sign-in completes on this page.
    const { data: sub } = supabase().auth.onAuthStateChange(() => run());
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography sx={{ fontFamily: MONO, fontSize: '0.75rem', color: ACCENT2, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
        Owner · analytics
      </Typography>
      <Typography component="h1" sx={{ fontFamily: SERIF, fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 700, mb: 3, color: 'text.primary' }}>
        Who signed up, and what they opened
      </Typography>

      {state.kind === 'loading' && <Typography sx={{ color: 'text.secondary' }}>Loading…</Typography>}
      {state.kind === 'signed-out' && (
        <Typography sx={{ color: 'text.secondary' }}>Sign in (top right) to load the numbers.</Typography>
      )}
      {state.kind === 'forbidden' && (
        <Typography sx={{ color: 'text.secondary' }}>This account is not a site owner.</Typography>
      )}
      {state.kind === 'error' && (
        <Typography sx={{ color: ACCENT2 }}>Could not load analytics: {state.message}</Typography>
      )}
      {state.kind === 'ready' && (
        <>
          <Section
            title="Demo opens by project"
            hint="demo_events · event = demo_open · one row per project"
            rows={state.data.opens}
            columns={['slug', 'total_opens', 'unique_viewers', 'first_open', 'last_open']}
          />
          <Section
            title="Signups by day"
            hint="auth.users · grouped by day and provider"
            rows={state.data.signups}
            columns={['day', 'provider', 'signups']}
          />
          <Section
            title="Recent activity"
            hint="last 500 events · who, what, when"
            rows={state.data.recent}
            columns={['created_at', 'email', 'full_name', 'company', 'role', 'event', 'slug', 'country']}
          />
        </>
      )}

      {/* Baked into the page by the server route, so it needs no session and
          no fetch; nothing renders until the harvester has found something. */}
      {misses.length > 0 && (
        <Section
          title="Search misses"
          hint="content/search-misses.jsonl · searches that returned nothing"
          rows={misses.map((m) => ({ query: m.q, count: m.count, first_seen: m.first_seen }))}
          columns={['query', 'count', 'first_seen']}
        />
      )}
    </Container>
  );
}
