'use client';

// The /saved page's body.
//
// Static export means this ships as one shared, empty shell: the prerendered
// HTML is the "loading" branch below, identical for everybody, and the reader's
// own saved set only ever arrives client-side over their JWT. No reader's list
// can leak into another's HTML because no reader's list is ever in the HTML.

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Bookmark, Login } from '@mui/icons-material';
import BlogPage from './BlogPage';
import { usePostArchive, type PostArchive } from '../lib/usePostArchive';
import ReaderStateNotice from './ReaderStateNotice';
import { MONO, SERIF, ACCENT, type BlogPost } from './blogShared';
import { loadReaderState, watchReaderAuth, type ReaderStateMap } from '../lib/readerState';

type Phase = 'loading' | 'signedOut' | 'ready' | 'error';

export default function SavedPosts({ posts: initial, archive }: { posts: BlogPost[]; archive?: PostArchive }) {
  const [retry, setRetry] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const { posts, loading: archiveLoading, error: archiveError, retry: retryArchive } = usePostArchive(initial, archive, phase === 'ready');
  const [state, setState] = useState<ReaderStateMap | null>(null);

  // Tracked, not probed once: signing out here has to fall back to the sign-in
  // prompt rather than keep showing the previous reader's saved posts.
  //
  // Only a CHANGE of reader reloads. supabase-js emits TOKEN_REFRESHED roughly
  // hourly, and treating that as a fresh sign-in made a reader parked on this
  // page watch the intro flash "2 posts saved" → "Loading…" → "2 posts saved"
  // for no reason they caused.
  const readerRef = useRef<string | null>(null);
  useEffect(() => {
    readerRef.current = null;
    let live = true;
    const stop = watchReaderAuth((userId) => {
      if (!live) return;
      if (!userId) { readerRef.current = null; setState(null); setPhase('signedOut'); return; }
      if (userId === readerRef.current) return;   // same reader, new token
      readerRef.current = userId;
      setPhase('loading');
      void loadReaderState().then((loaded) => {
        if (!live || readerRef.current !== userId) return;
        setState(loaded);
        setPhase('ready');
      }).catch(() => { if (live && readerRef.current === userId) setPhase('error'); });
    });
    return () => { live = false; stop(); };
  }, [retry]);

  if (phase === 'error' || archiveError) return <Container maxWidth="md" sx={{ py: 8 }}><Typography component="h1" variant="h4">Saved posts</Typography><ReaderStateNotice onRetry={() => { setRetry((n) => n + 1); retryArchive(); }} /></Container>;

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
      // A function, so the count follows what is actually on screen: unsaving a
      // card removes it inside BlogPage, and a count computed from `saved` here
      // would still claim the post that just left.
      intro={phase === 'loading' || (phase === 'ready' && archiveLoading)
        ? 'Loading the posts you saved for later.'
        : (visible: number) => `${visible} post${visible === 1 ? '' : 's'} saved for later.`}
      // "nothing saved yet" only when nothing IS saved. With saved posts on the
      // page an empty list means a topic filter or search inside /saved matched
      // none of them, which is BlogPage's own message to give.
      emptyMessage={phase === 'loading' || (phase === 'ready' && archiveLoading)
        ? '// loading your saved posts…'
        : saved.length === 0
          ? '// nothing saved yet — use Save on any post to keep it here'
          : undefined}
    />
  );
}
