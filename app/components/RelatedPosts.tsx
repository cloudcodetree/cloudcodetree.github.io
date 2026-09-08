'use client';

import { Box, Typography, Grid } from '@mui/material';
import Link from 'next/link';
import { BlogPost, SERIF, MONO, LINK, formatLongDate } from './blogShared';
import { Corners } from './Blueprint';

const border = '1px solid rgba(148,163,184,0.12)';

/** Up to five nearest posts by meaning, chosen at build time (public/blog/related.json). */
export default function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return (
    <Box component="section" data-related aria-labelledby="related-heading" sx={{ mt: 6 }}>
      <Typography id="related-heading" sx={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'text.secondary', mb: 2 }}>
        Related
      </Typography>
      <Grid container spacing={2}>
        {posts.map((p) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
            <Box component={Link} href={`/ai-news/${p.id}/`}
              sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, height: '100%', p: 2, border, position: 'relative', textDecoration: 'none', transition: 'border-color .2s', '&:hover': { borderColor: 'rgba(148,188,227,0.55)' } }}>
              <Corners />
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: 'text.secondary', letterSpacing: '0.04em' }}>{formatLongDate(p.date)}</Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.2, color: 'text.primary', '&:hover': { color: LINK } }}>{p.title}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
