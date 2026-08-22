'use client';

// Signed-in indicator + sign-out for the Projects section. Renders nothing for
// anonymous visitors, so the public pages are visually unchanged.
//
// Sign-out clears BOTH sessions deliberately: supabase-js only wipes its own
// localStorage token — the HttpOnly demo cookie would keep admitting this
// browser for up to an hour unless /api/session DELETE clears it too.

import { useEffect, useState } from 'react';
import { Avatar, Box, IconButton, Menu, MenuItem, Typography, Divider, ListItemIcon } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { MONO } from '../blogShared';
import { supabase } from '../../lib/supabaseClient';

interface SessionUser {
  email: string;
  name?: string;
  avatarUrl?: string;
}

export default function AccountMenu() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const client = supabase();
    const read = (session: { user?: { email?: string; user_metadata?: Record<string, unknown> } } | null) => {
      const u = session?.user;
      if (!u?.email) { setUser(null); return; }
      const meta = u.user_metadata ?? {};
      setUser({
        email: u.email,
        name: (meta.full_name ?? meta.name) as string | undefined,
        avatarUrl: (meta.avatar_url ?? meta.picture) as string | undefined,
      });
    };
    void client.auth.getSession().then(({ data }) => read(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => read(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!user) return null;

  const initial = (user.name ?? user.email)[0]?.toUpperCase() ?? '?';

  const signOut = async () => {
    setAnchor(null);
    // Both halves, order-independent; navigation waits for neither to render.
    await Promise.allSettled([
      supabase().auth.signOut(),
      fetch('/api/session', { method: 'DELETE' }),
    ]);
    setUser(null);
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small" aria-label={`Account: ${user.email}`} sx={{ p: 0.25 }}>
        <Avatar src={user.avatarUrl} alt="" sx={{ width: 30, height: 30, fontSize: 14, bgcolor: 'rgba(63,185,80,0.25)', border: '1px solid rgba(63,185,80,0.5)' }}>
          {initial}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { background: '#161b22', border: '1px solid rgba(148,163,184,0.15)', minWidth: 220 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          {user.name && <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{user.name}</Typography>}
          <Typography sx={{ fontFamily: MONO, fontSize: 12, color: 'text.secondary' }}>{user.email}</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)' }} />
        <MenuItem onClick={() => void signOut()} sx={{ fontFamily: MONO, fontSize: 13 }}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
