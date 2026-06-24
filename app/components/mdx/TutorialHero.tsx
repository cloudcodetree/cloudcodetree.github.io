'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import { tutorials, seriesParts, seriesTotal, SERIES_INFO } from '../../tutorials/manifest';
import { MONO, ACCENT, LINK } from '../blogShared';

/**
 * Article header for a tutorial: the cover image, a "Series · Part N of M"
 * eyebrow, and a course panel — a one-line summary of the series plus a
 * clickable table of contents with the current part marked "you are here".
 * The .mdx still writes its own H1 below this.
 * Usage in .mdx:  <TutorialHero slug="vector-database-for-rag" />
 */
export default function TutorialHero({ slug }: { slug: string }) {
  const t = tutorials.find((x) => x.slug === slug);
  if (!t) return null;
  const total = seriesTotal(t.series);
  const parts = seriesParts(t.series);
  const blurb = SERIES_INFO[t.series]?.blurb;

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

      <Box sx={{ mt: 1.5, p: { xs: 2, md: 2.5 }, borderRadius: 2, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(148,163,184,0.04)' }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase', mb: 0.75 }}>
          The {t.series} course · {total} parts
        </Typography>
        {blurb && (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.55, mb: 1.5 }}>{blurb}</Typography>
        )}
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {parts.map((p) => {
            const here = p.slug === t.slug;
            return (
              <Box
                component="li"
                key={p.slug}
                sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25, py: 0.5, borderLeft: '2px solid', borderColor: here ? ACCENT : 'transparent', pl: 1.25 }}
              >
                <Box component="span" sx={{ fontFamily: MONO, fontSize: 12, color: here ? ACCENT : 'text.secondary', flexShrink: 0, width: 18 }}>
                  {String(p.part).padStart(2, '0')}
                </Box>
                {here ? (
                  <Typography component="span" sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.primary' }}>
                    {p.title}
                    <Box component="span" sx={{ fontFamily: MONO, fontSize: 11, color: ACCENT, ml: 1, fontWeight: 400 }}>← you are here</Box>
                  </Typography>
                ) : (
                  <Typography component={Link} href={`/tutorials/${p.slug}/`} sx={{ fontSize: '0.95rem', color: LINK, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {p.title}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
