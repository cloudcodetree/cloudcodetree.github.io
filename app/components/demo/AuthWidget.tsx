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

const NEXT_RE = /^\/projects\/(?!covers\/)[a-z0-9-]+\/(demo\/.*)?$/;

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
  const [profileFor, setProfileFor] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase();
    void client.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const continueTo = useCallback(async (next: string) => {
    const { data } = await supabase().auth.getSession();
    const session = data.session;
    if (!session) { setNextPath(next); setDialogOpen(true); return; }
    const { data: rows } = await supabase().from('profiles').select('user_id').eq('user_id', session.user.id);
    if (!rows?.length) { setNextPath(next); setProfileFor(session.user.id); return; }
    if (await mintCookie()) window.location.assign(next);
  }, []);

  // The site-wide ?signin=1&next= handler.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signin') !== '1') return;
    const next = params.get('next') ?? '';
    if (!NEXT_RE.test(next)) return;
    void continueTo(next);
  }, [continueTo]);

  const onProfileDone = () => {
    setProfileFor(null);
    void mintCookie().then((ok) => { if (ok) window.location.assign(nextPath); });
  };

  return (
    <>
      {signedIn ? (
        <AccountMenu />
      ) : (
        <Button size="small" startIcon={<Login />} onClick={() => setDialogOpen(true)}
          sx={{ fontFamily: MONO, textTransform: 'none', color: 'inherit', '&:hover': { backgroundColor: 'rgba(116,157,196,0.1)' } }}>
          Sign in
        </Button>
      )}
      <SignInDialog open={dialogOpen} onClose={() => setDialogOpen(false)} nextPath={nextPath} />
      <ProfileDialog open={!!profileFor} userId={profileFor ?? ''} onDone={onProfileDone} />
    </>
  );
}
