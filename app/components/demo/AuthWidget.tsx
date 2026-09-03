'use client';

// The supabase-backed half of the global auth control. Loaded lazily by
// GlobalAuth so anonymous visitors never pay for supabase-js.
//
// Owns the ?signin=1&next= round trip for the whole site: the Worker bounces
// every gated path to /projects/?signin=1&next=<path>, and Supabase returns
// OAuth/magic-link users to the same URL. Session → (one-time profile) →
// mint the HttpOnly cookie → continue to `next`.

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { Login } from '@mui/icons-material';
import { MONO } from '../blogShared';
import { supabase } from '../../lib/supabaseClient';
import AccountMenu from './AccountMenu';
import SignInDialog from './SignInDialog';
import ProfileDialog from './ProfileDialog';

// Any same-origin relative path may be a return target (open-redirect guard:
// must start with a single "/", never "//" or a scheme).
const NEXT_RE = /^\/(?!\/)[^\s]*$/;

/** The page the visitor is on, minus any sign-in round-trip params. */
function here(): string {
  const u = new URL(window.location.href);
  u.searchParams.delete('signin');
  u.searchParams.delete('next');
  return u.pathname + u.search;
}

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

export default function AuthWidget({ initialDialogOpen = false }: { initialDialogOpen?: boolean }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [dialogOpen, setDialogOpen] = useState(initialDialogOpen);
  const [nextPath, setNextPath] = useState<string>('/projects/');
  useEffect(() => { if (initialDialogOpen) setNextPath(here()); }, [initialDialogOpen]);
  const [profileFor, setProfileFor] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase();
    void client.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Mint the cookie, then either stay (just tidy the URL) or go to `next`.
  const finish = useCallback(async (next: string) => {
    if (!(await mintCookie())) return;
    if (next === here()) window.history.replaceState(null, '', next);
    else window.location.assign(next);
  }, []);

  const continueTo = useCallback(async (next: string) => {
    const { data } = await supabase().auth.getSession();
    const session = data.session;
    if (!session) { setNextPath(next); setDialogOpen(true); return; }
    const { data: rows } = await supabase().from('profiles').select('user_id').eq('user_id', session.user.id);
    if (!rows?.length) { setNextPath(next); setProfileFor(session.user.id); return; }
    await finish(next);
  }, [finish]);

  // The site-wide ?signin=1&next= handler (Worker bounces + Supabase returns).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signin') !== '1') return;
    const raw = params.get('next') ?? '';
    void continueTo(NEXT_RE.test(raw) ? raw : here());
  }, [continueTo]);

  const onProfileDone = () => {
    setProfileFor(null);
    void finish(nextPath);
  };

  const openSignIn = () => { setNextPath(here()); setDialogOpen(true); };

  return (
    <>
      {signedIn ? (
        <AccountMenu />
      ) : (
        <Button size="small" startIcon={<Login />} onClick={openSignIn}
          sx={{ fontFamily: MONO, textTransform: 'none', color: 'inherit', '&:hover': { backgroundColor: 'rgba(116,157,196,0.1)' } }}>
          Sign in
        </Button>
      )}
      <SignInDialog open={dialogOpen} onClose={() => setDialogOpen(false)} nextPath={nextPath} />
      <ProfileDialog open={!!profileFor} userId={profileFor ?? ''} onDone={onProfileDone} />
    </>
  );
}
