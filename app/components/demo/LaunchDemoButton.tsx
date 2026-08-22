'use client';

// The whole launch flow in one component, mounted on gallery cards and detail
// pages: session check → sign-in dialog → one-time profile → mint the
// HttpOnly cookie via POST /api/session → navigate to the demo. Also handles
// ?signin=1&next= arrivals (the Worker's redirect and Supabase's return trip).

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { PlayArrow, Login } from '@mui/icons-material';
import { MONO } from '../blogShared';
import { supabase } from '../../lib/supabaseClient';
import SignInDialog from './SignInDialog';
import ProfileDialog from './ProfileDialog';

const NEXT_RE = /^\/projects\/[a-z0-9-]+\/demo\//;

async function mintCookie(): Promise<boolean> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ access_token: token }),
  });
  return res.ok;
}

export default function LaunchDemoButton({
  slug,
  title,
  size = 'medium',
}: {
  slug: string;
  title: string;
  size?: 'small' | 'medium';
}) {
  const demoPath = `/projects/${slug}/demo/`;
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileFor, setProfileFor] = useState<string | null>(null);
  const [pendingNext, setPendingNext] = useState<string | null>(null);

  useEffect(() => {
    void supabase().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const continueTo = useCallback(async (next: string) => {
    const { data } = await supabase().auth.getSession();
    const session = data.session;
    if (!session) { setDialogOpen(true); return; }
    // One-time profile ask (skippable; skipped=true suppresses forever).
    const { data: rows } = await supabase().from('profiles').select('user_id').eq('user_id', session.user.id);
    if (!rows?.length) {
      setPendingNext(next);
      setProfileFor(session.user.id);
      return;
    }
    if (await mintCookie()) window.location.assign(next);
  }, []);

  // Handle ?signin=1&next= — from the Worker's 302 or Supabase's return trip.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signin') !== '1') return;
    const next = params.get('next') ?? '';
    if (!NEXT_RE.test(next)) return;
    void supabase().auth.getSession().then(({ data }) => {
      if (data.session) void continueTo(next);
      else setDialogOpen(true);
    });
  }, [continueTo]);

  const onProfileDone = () => {
    setProfileFor(null);
    const next = pendingNext ?? demoPath;
    setPendingNext(null);
    void mintCookie().then((ok) => { if (ok) window.location.assign(next); });
  };

  return (
    <>
      <Button
        variant="contained"
        size={size}
        startIcon={signedIn ? <PlayArrow /> : <Login />}
        onClick={() => void continueTo(demoPath)}
        sx={{ fontFamily: MONO, textTransform: 'none', fontWeight: 600 }}
      >
        {signedIn ? 'Launch demo' : 'Sign in to launch'}
      </Button>
      <SignInDialog open={dialogOpen} onClose={() => setDialogOpen(false)} projectTitle={title} nextPath={demoPath} />
      <ProfileDialog open={!!profileFor} userId={profileFor ?? ''} onDone={onProfileDone} />
    </>
  );
}
