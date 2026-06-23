'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Typography, Box, Pagination, ToggleButtonGroup, ToggleButton, Grid, Chip, Select, MenuItem } from '@mui/material';
import { GridView, ViewList } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SERIF, MONO, ACCENT, LINK, formatLongDate } from './blogShared';
import type { Tutorial } from '../tutorials/manifest';

type View = 'cards' | 'list';
const VIEWS: View[] = ['cards', 'list'];
const PAGE_DEFAULT: Record<View, number> = { cards: 20, list: 40 };
const PAGE_OPTIONS = [10, 20, 40, 50];
const border = '1px solid rgba(148,163,184,0.12)';
const clamp = (n: number) => ({ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: n, overflow: 'hidden' } as const);
const topicTags = (t: Tutorial) => t.tags.filter((x) => x.toLowerCase() !== 'ai' && x.toLowerCase() !== 'tutorial');

export default function TutorialsList({ tutorials }: { tutorials: Tutorial[] }) {
  const [view, setView] = useState<View>('cards');
  const [size, setSize] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const v = window.localStorage.getItem('tut-view') as View | null;
    if (v && VIEWS.includes(v)) setView(v);
  }, []);

  const topics = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tutorials) for (const tag of topicTags(t)) c[tag] = (c[tag] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
  }, [tutorials]);

  const filtered = useMemo(
    () => (selected.length ? tutorials.filter((t) => t.tags.some((x) => selected.includes(x))) : tutorials),
    [tutorials, selected],
  );

  const pageSize = size ?? PAGE_DEFAULT[view];
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const chooseView = (v: View | null) => { if (v) { setView(v); setSize(null); window.localStorage.setItem('tut-view', v); } };
  const toggle = (tag: string) => { setSelected((p) => (p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag])); setPage(1); };

  const meta = (t: Tutorial) => `${formatLongDate(t.date)} · ${t.readTime} min`;
  const Pills = ({ t }: { t: Tutorial }) => (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {topicTags(t).slice(0, 3).map((tag) => (
        <Chip key={tag} label={tag} size="small" sx={{ height: 22, fontFamily: MONO, fontSize: 10, background: 'rgba(63,185,80,0.1)', color: ACCENT, border: '1px solid rgba(63,185,80,0.25)' }} />
      ))}
    </Box>
  );

  const cards = (
    <Grid container spacing={3}>
      {shown.map((t, i) => (
        <Grid size={{ xs: 12, sm: 6 }} key={t.slug}>
          <Box component={motion.div} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
            sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, border, overflow: 'hidden', background: 'rgba(148,163,184,0.03)', transition: 'border-color .2s, transform .2s', '&:hover': { borderColor: 'rgba(63,185,80,0.4)', transform: 'translateY(-2px)' } }}>
            {t.image && (
              <Box component={Link} href={`/tutorials/${t.slug}/`} sx={{ display: 'block' }}>
                <Box component="img" src={t.image} alt={t.title} loading="lazy" sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
              </Box>
            )}
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25, flexGrow: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: ACCENT, letterSpacing: '0.06em' }}>{`TUTORIAL ${String(t.order).padStart(2, '0')}`}</Typography>
              <Typography component={Link} href={`/tutorials/${t.slug}/`} sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.2, color: 'text.primary', textDecoration: 'none', ...clamp(3), '&:hover': { color: LINK } }}>{t.title}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.5, ...clamp(3) }}>{t.excerpt}</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>{meta(t)}</Typography>
              <Box sx={{ mt: 'auto', pt: 0.5 }}><Pills t={t} /></Box>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  const list = (
    <Box>
      {shown.map((t, i) => (
        <Box key={t.slug} component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.25) }}
          sx={{ display: 'flex', gap: 2.5, py: 3, borderTop: border, alignItems: 'flex-start' }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 13, color: ACCENT, pt: 0.5, flexShrink: 0 }}>{String(t.order).padStart(2, '0')}</Typography>
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography component={Link} href={`/tutorials/${t.slug}/`} sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' }, lineHeight: 1.15, color: 'text.primary', textDecoration: 'none', ...clamp(2), '&:hover': { color: LINK } }}>{t.title}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.5, ...clamp(2) }}>{t.excerpt}</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>{meta(t)}</Typography>
            <Pills t={t} />
          </Box>
        </Box>
      ))}
      <Box sx={{ borderTop: border }} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
      <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography sx={{ fontFamily: MONO, color: ACCENT, fontSize: 12, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', mb: 1.5 }}>CloudCodeTree&nbsp;·&nbsp;Learn</Typography>
        <Typography component="h1" sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '3rem', md: '4.75rem' }, lineHeight: 0.95, letterSpacing: '-0.02em', m: 0, background: 'linear-gradient(180deg,#fff 0%,#cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tutorials</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ height: 2, width: 56, background: ACCENT, alignSelf: 'center' }} />
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: 600 }}>Hands-on, hand-written guides to building and customizing AI — separate from the daily AI News feed.</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>Per page</Typography>
          <Select value={pageSize} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }} size="small" sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(148,163,184,0.2)' }, '.MuiSvgIcon-root': { color: 'text.secondary' } }}>
            {PAGE_OPTIONS.map((n) => <MenuItem key={n} value={n} sx={{ fontFamily: MONO, fontSize: 12 }}>{n}</MenuItem>)}
          </Select>
        </Box>
        <ToggleButtonGroup value={view} exclusive size="small" onChange={(_, v) => chooseView(v)} aria-label="Choose layout" sx={{ '& .MuiToggleButton-root': { color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)', px: 1.25 }, '& .Mui-selected': { color: `${ACCENT} !important`, background: 'rgba(63,185,80,0.12) !important' } }}>
          <ToggleButton value="cards" aria-label="Cards"><GridView fontSize="small" /></ToggleButton>
          <ToggleButton value="list" aria-label="Compact list"><ViewList fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {topics.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: { xs: 3, md: 4 } }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', mr: 0.5 }}>Topics</Typography>
          {topics.map(({ tag, count }) => {
            const on = selected.includes(tag);
            return <Chip key={tag} label={`${tag} ${count}`} size="small" onClick={() => toggle(tag)} sx={{ fontFamily: MONO, fontSize: 11, cursor: 'pointer', color: on ? '#0d1117' : 'text.secondary', background: on ? ACCENT : 'transparent', border: '1px solid', borderColor: on ? ACCENT : 'rgba(148,163,184,0.25)', '& .MuiChip-label': { px: 1 }, '&:hover': { background: on ? ACCENT : 'rgba(63,185,80,0.12)' } }} />;
          })}
          {selected.length > 0 && <Chip label="Clear" size="small" onClick={() => { setSelected([]); setPage(1); }} sx={{ fontFamily: MONO, fontSize: 11, cursor: 'pointer', color: ACCENT, background: 'transparent', border: '1px solid', borderColor: ACCENT, '& .MuiChip-label': { px: 1 } }} />}
        </Box>
      )}

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><Typography sx={{ fontFamily: MONO, color: 'text.secondary', fontSize: 14 }}>{'// no tutorials yet'}</Typography></Box>
      ) : (
        <>
          {view === 'cards' ? cards : list}
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination count={pageCount} page={safePage} onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }} shape="rounded" sx={{ '& .MuiPaginationItem-root': { fontFamily: MONO, color: 'text.secondary', borderColor: 'rgba(148,163,184,0.2)' }, '& .Mui-selected': { background: `${ACCENT} !important`, color: '#0d1117', borderColor: ACCENT } }} />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
