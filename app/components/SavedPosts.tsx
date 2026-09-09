'use client';

// The /saved page's body.
//
// Static export means this ships as one shared, empty shell: the prerendered
// HTML is the "loading" branch below, identical for everybody, and the reader's
// own saved set only ever arrives client-side over their JWT. No reader's list
// can leak into another's HTML because no reader's list is ever in the HTML.

import { useEffect, useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Bookmark, Login } from '@mui/icons-material';
import BlogPage from './BlogPage';
import { MONO, SERIF, ACCENT, type BlogPost } from './blogShared';
import { hasReaderSession, loadReaderState, type ReaderStateMap } from '../lib/readerState';

type Phase = 'loading' | 'signedOut' | 'ready';

export default function SavedPosts({ posts }: { posts: BlogPost[] }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [state, setState] = useState<ReaderStateMap | null>(null);

  useEffect(() => {
    if (!hasReaderSession()) { setPhase('signedOut'); return; }
    let live = true;
    void loadReaderState().then((loaded) => {
      if (!live) return;
      setState(loaded);
      setPhase('ready');
    });
    return () => { live = false; };
  }, []);

  if (phase === 'signedOut') {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 14 }, textAlign: 'center' }}>
        <Bookmark sx={{ fontSize: 44, color: ACCENT, opacity: 0.7, mb: 2 }} />
        <Typography component="h1"
          sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '2.4rem', md: '3.2rem' }, lineHeight: 1, mb: 2 }}>
          Saved
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1.05rem', maxWidth: 460, mx: 'auto', mb: 4 }}>
          Sign in to save posts for later and to see which ones you have already read.
          Your reading state is yours alone — nobody else can see it.
        </Typography>
        {/* A real navigation, not next/link: ?signin=1 is read once, on mount,
            by GlobalAuth — a client-side route change would never re-arm it. */}
        <Button component="a" href="/saved/?signin=1" variant="outlined" startIcon={<Login />}
          sx={{
            fontFamily: MONO, fontSize: 13, textTransform: 'none', color: ACCENT,
            borderColor: 'rgba(148,188,227,0.45)', px: 2.5, py: 1,
            '&:hover': { borderColor: ACCENT, background: 'rgba(148,188,227,0.08)' },
          }}>
          Sign in
        </Button>
        <Box sx={{ mt: 5 }}>
          <Typography component="a" href="/"
            sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: ACCENT } }}>
            ← back to AI News
          </Typography>
        </Box>
      </Container>
    );
  }

  const saved = state ? posts.filter((post) => !!state.get(post.id)?.saved) : [];

  // onlySaved keeps the list honest after hydration: unsaving a card here drops
  // it immediately, without this component re-querying.
  return (
    <BlogPage
      posts={saved}
      onlySaved
      heading="Saved"
      feedPath="/feed.xml"
      intro={phase === 'loading'
        ? 'Loading the posts you saved for later.'
        : `${saved.length} post${saved.length === 1 ? '' : 's'} saved for later.`}
      emptyMessage={phase === 'loading'
        ? '// loading your saved posts…'
        : '// nothing saved yet — use Save on any post to keep it here'}
    />
  );
}
