'use client';

import { useMemo, useState } from 'react';
import { Container, Typography, Box, Grid, Chip, Button } from '@mui/material';
import { GitHub, Launch, LockClock } from '@mui/icons-material';
import LaunchDemoButton from './demo/LaunchDemoButton';
import AccountMenu from './demo/AccountMenu';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SERIF, MONO, ACCENT, LINK } from './blogShared';
import type { Project } from '../projects/manifest';

const border = '1px solid rgba(148,163,184,0.12)';
const clamp = (n: number) => ({ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: n, overflow: 'hidden' } as const);

export default function ProjectsList({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const techs = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of projects) for (const t of p.tech) c[t] = (c[t] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
  }, [projects]);

  const filtered = useMemo(
    () => (selected.length ? projects.filter((p) => p.tech.some((t) => selected.includes(t))) : projects),
    [projects, selected],
  );

  const toggle = (tag: string) =>
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
      <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ fontFamily: MONO, color: ACCENT, fontSize: 12, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase' }}>CloudCodeTree&nbsp;·&nbsp;Build</Typography>
          <AccountMenu />
        </Box>
        <Typography component="h1" sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '3rem', md: '4.75rem' }, lineHeight: 0.95, letterSpacing: '-0.02em', m: 0, background: 'linear-gradient(180deg,#fff 0%,#cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Projects</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 2.5, flexWrap: 'wrap' }}>
          <Box sx={{ height: 2, width: 56, background: ACCENT, alignSelf: 'center' }} />
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: 620 }}>
            Things I&apos;ve built — native apps, browser experiments, home-automation tooling, and full products. Live demos are coming to selected projects.
          </Typography>
        </Box>
      </Box>

      {techs.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: { xs: 3, md: 4 } }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', mr: 0.5 }}>Tech</Typography>
          {techs.map(({ tag, count }) => {
            const on = selected.includes(tag);
            return <Chip key={tag} label={`${tag} ${count}`} size="small" onClick={() => toggle(tag)} sx={{ fontFamily: MONO, fontSize: 11, cursor: 'pointer', color: on ? '#0d1117' : 'text.secondary', background: on ? ACCENT : 'transparent', border: '1px solid', borderColor: on ? ACCENT : 'rgba(148,163,184,0.25)', '& .MuiChip-label': { px: 1 }, '&:hover': { background: on ? ACCENT : 'rgba(63,185,80,0.12)' } }} />;
          })}
          {selected.length > 0 && <Chip label="Clear" size="small" onClick={() => setSelected([])} sx={{ fontFamily: MONO, fontSize: 11, cursor: 'pointer', color: ACCENT, background: 'transparent', border: '1px solid', borderColor: ACCENT, '& .MuiChip-label': { px: 1 } }} />}
        </Box>
      )}

      <Grid container spacing={3}>
        {filtered.map((p, i) => {
          const wide = !!p.featured && selected.length === 0;
          return (
            <Grid size={{ xs: 12, sm: wide ? 12 : 6 }} key={p.slug}>
              <Box component={motion.div} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, border, overflow: 'hidden', background: 'rgba(148,163,184,0.03)', transition: 'border-color .2s, transform .2s', '&:hover': { borderColor: 'rgba(63,185,80,0.4)', transform: 'translateY(-2px)' } }}>
                <Box component={Link} href={`/projects/${p.slug}/`} sx={{ display: 'block' }}>
                  <Box component="img" src={p.cover} alt={p.title} loading="lazy" sx={{ width: '100%', aspectRatio: wide ? '32 / 9' : '16 / 9', objectFit: 'cover', display: 'block' }} />
                </Box>
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25, flexGrow: 1 }}>
                  <Typography component={Link} href={`/projects/${p.slug}/`} sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: '1.35rem', lineHeight: 1.2, color: 'text.primary', textDecoration: 'none', '&:hover': { color: LINK } }}>{p.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.5, ...clamp(3) }}>{p.summary}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {p.tech.slice(0, 4).map((t) => (
                      <Chip key={t} label={t} size="small" sx={{ height: 22, fontFamily: MONO, fontSize: 10, background: 'rgba(63,185,80,0.1)', color: ACCENT, border: '1px solid rgba(63,185,80,0.25)' }} />
                    ))}
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 1, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button component={Link} href={`/projects/${p.slug}/`} size="small" sx={{ fontFamily: MONO, fontSize: 12, color: ACCENT, textTransform: 'none', px: 0, minWidth: 0, '&:hover': { color: LINK, background: 'transparent' } }}>Read more →</Button>
                    {p.repoUrl && (
                      <Typography component="a" href={p.repoUrl} target="_blank" rel="noopener noreferrer" aria-label={`${p.title} source on GitHub`} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontFamily: MONO, fontSize: 12, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: LINK } }}>
                        <GitHub sx={{ fontSize: 15 }} /> Source
                      </Typography>
                    )}
                    {p.externalUrl && (
                      <Typography component="a" href={p.externalUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontFamily: MONO, fontSize: 12, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: LINK } }}>
                        <Launch sx={{ fontSize: 15 }} /> Live
                      </Typography>
                    )}
                    {p.demo?.status === 'live' && <LaunchDemoButton slug={p.slug} title={p.title} size="small" />}
                    {p.demo?.status === 'coming-soon' && (
                      <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontFamily: MONO, fontSize: 11, color: 'text.secondary', border: '1px dashed rgba(148,163,184,0.35)', borderRadius: 1, px: 1, py: 0.25 }}>
                        <LockClock sx={{ fontSize: 14 }} /> Gated demo soon
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 7 }}>
        <Button href="https://github.com/cloudcodetree" target="_blank" rel="noopener noreferrer" variant="outlined" startIcon={<GitHub />} sx={{ fontFamily: MONO, textTransform: 'none', color: ACCENT, borderColor: 'rgba(63,185,80,0.4)', '&:hover': { borderColor: ACCENT, background: 'rgba(63,185,80,0.08)' } }}>
          More on GitHub
        </Button>
      </Box>
    </Container>
  );
}
