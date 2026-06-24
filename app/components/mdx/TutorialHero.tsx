'use client';

import { Box, Typography } from '@mui/material';
import { tutorials, seriesTotal } from '../../tutorials/manifest';
import { MONO, ACCENT } from '../blogShared';

/**
 * Article hero for a tutorial: the cover image + a "Series · Part N of M"
 * eyebrow as real text (the cover bakes the same in pixels; this is the
 * accessible/SEO version). The .mdx still writes its own H1 below this.
 * Usage in .mdx:  <TutorialHero slug="vector-database-for-rag" />
 */
export default function TutorialHero({ slug }: { slug: string }) {
  const t = tutorials.find((x) => x.slug === slug);
  if (!t) return null;
  const total = seriesTotal(t.series);
  return (
    <Box sx={{ mb: 3 }}>
      {t.image && (
        <Box
          component="img"
          src={t.image}
          alt={`${t.series}: ${t.title}`}
          sx={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 2, mb: 2.5, border: '1px solid rgba(148,163,184,0.12)' }}
        />
      )}
      <Typography sx={{ fontFamily: MONO, fontSize: 12, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {t.series} · Part {t.part} of {total}
      </Typography>
    </Box>
  );
}
