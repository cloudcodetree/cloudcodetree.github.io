'use client';

import { Box, Typography, Chip } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SERIF, MONO, ACCENT, LINK } from './blogShared';
import type { Tutorial } from '../tutorials/manifest';

const PHASES = ['Data', 'ML', 'Search', 'Agents', 'MCP', 'MLOps', 'Serving', 'Cloud', 'Full-stack SaaS', 'Ship'];

/**
 * Flagship "home" card for the tutorials landing page. Explains the whole
 * project (build one real product end to end) and links to the full course —
 * Start (Part 1) and Browse all parts (the individual-cards view).
 */
export default function CourseHomeCard({ parts, allHref = '/tutorials/all/' }: { parts: Tutorial[]; allHref?: string }) {
  const sorted = [...parts].sort((a, b) => a.part - b.part);
  const first = sorted[0];
  const total = sorted.length;

  const cta = {
    display: 'inline-flex', alignItems: 'center', gap: 0.5, fontFamily: MONO, fontSize: 13,
    textDecoration: 'none', px: 1.75, py: 1, borderRadius: 1.5, transition: 'all .2s',
  } as const;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      sx={{
        position: 'relative', overflow: 'hidden', borderRadius: 3, mb: { xs: 4, md: 5 },
        border: '1px solid rgba(14,165,233,0.28)',
        background: 'radial-gradient(120% 140% at 0% 0%, rgba(14,165,233,0.14) 0%, rgba(13,17,23,0) 55%), linear-gradient(180deg, rgba(148,163,184,0.05), rgba(148,163,184,0.02))',
        p: { xs: 3, md: 5 },
      }}
    >
      {/* decorative glow */}
      <Box aria-hidden sx={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.16), transparent 70%)', pointerEvents: 'none' }} />

      <Typography sx={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#0ea5e9', mb: 1.5 }}>
        Featured course · The flagship build
      </Typography>

      <Typography component="h2" sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.9rem', md: '2.9rem' }, lineHeight: 1.08, letterSpacing: '-0.01em', m: 0, maxWidth: 820, color: 'text.primary' }}>
        Become an AI engineer by building one real product, end to end.
      </Typography>

      <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6, mt: 2, maxWidth: 780 }}>
        <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>DealFinder</Box> is a working, multi-source deal-aggregator SaaS you build from scratch across {total} parts — real data pipelines, an ML price model, semantic search, a tool-using agent + MCP server, MLflow and the full MLOps loop, a FastAPI service, cloud &amp; Kubernetes, and a React front end with auth and payments. Every part is real, tested code on real electronics data. No toy datasets, no hand-waving — you ship a product and learn to think like an AI engineer along the way.
      </Typography>

      {/* phase arc */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 3 }}>
        {PHASES.map((p, i) => (
          <Box key={p} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Chip label={p} size="small" sx={{ height: 24, fontFamily: MONO, fontSize: 11, background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.25)' }} />
            {i < PHASES.length - 1 && <Box sx={{ color: 'rgba(148,163,184,0.5)', fontFamily: MONO, fontSize: 12 }}>→</Box>}
          </Box>
        ))}
      </Box>

      <Typography sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', mt: 3 }}>
        {`${total} parts · real code on real data · 166 tests · one deployed SaaS`}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
        <Box component={Link} href={`/tutorials/${first.slug}/`} sx={{ ...cta, color: '#0d1117', background: ACCENT, fontWeight: 600, '&:hover': { background: '#4ade80' } }}>
          Start with Part 1 <ArrowForward sx={{ fontSize: 16 }} />
        </Box>
        <Box component={Link} href={allHref} sx={{ ...cta, color: ACCENT, border: '1px solid rgba(63,185,80,0.35)', '&:hover': { background: 'rgba(63,185,80,0.1)', color: LINK } }}>
          {`Browse all ${total} parts`} <ArrowForward sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    </Box>
  );
}
