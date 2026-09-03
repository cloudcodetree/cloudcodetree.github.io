'use client';

// Site-wide sign-in / avatar control for the AppBar. Anonymous visitors get a
// plain "Sign in" button and never load supabase-js; the real widget mounts
// only when a session exists in storage, a ?signin=1 round trip is landing,
// or the visitor clicks Sign in.

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@mui/material';
import { Login } from '@mui/icons-material';
import { MONO } from '../blogShared';

const AuthWidget = dynamic(() => import('./AuthWidget'), { ssr: false });

function hasStoredSession(): boolean {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
  } catch { return false; }
}

export default function GlobalAuth() {
  const [armed, setArmed] = useState(false);
  const [openOnMount, setOpenOnMount] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (hasStoredSession() || params.get('signin') === '1') setArmed(true);
  }, []);

  if (armed) return <AuthWidget initialDialogOpen={openOnMount} />;
  return (
    <Button size="small" startIcon={<Login />} onClick={() => { setOpenOnMount(true); setArmed(true); }}
      sx={{ fontFamily: MONO, textTransform: 'none', color: 'inherit', '&:hover': { backgroundColor: 'rgba(116,157,196,0.1)' } }}>
      Sign in
    </Button>
  );
}
