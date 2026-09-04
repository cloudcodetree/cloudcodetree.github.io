'use client';

import { useState } from 'react';
import { Dialog, DialogContent, Typography, TextField, Button, Box } from '@mui/material';
import { MONO, SERIF, ACCENT } from '../blogShared';
import { supabase } from '../../lib/supabaseClient';

/** One-time, skippable. Skip writes skipped=true so it never re-asks. */
export default function ProfileDialog({
  open,
  userId,
  onDone,
}: {
  open: boolean;
  userId: string;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = async (skipped: boolean) => {
    setBusy(true);
    // Best-effort: profile trouble must never block the demo.
    try {
      await supabase().from('profiles').upsert({
        user_id: userId,
        full_name: skipped ? null : fullName || null,
        company: skipped ? null : company || null,
        role: skipped ? null : role || null,
        skipped,
      });
      if (!skipped) {
        await supabase().from('demo_events').insert({ event: 'profile_saved', slug: 'profile', user_id: userId });
      }
    } catch { /* ignore */ }
    onDone();
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth
      PaperProps={{ sx: { background: '#2b2b2d', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 2 } }}>
      <DialogContent sx={{ p: 4 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase', mb: 1 }}>
          Optional
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 600, mb: 1 }}>
          Who&apos;s visiting?
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 3 }}>
          Entirely optional — it just helps me know who&apos;s exploring these demos.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField size="small" id="profile-name" name="name" autoComplete="name" label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <TextField size="small" id="profile-company" name="organization" autoComplete="organization" label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <TextField size="small" id="profile-role" name="role" label="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button fullWidth variant="contained" disabled={busy} onClick={() => void finish(false)}
              sx={{ fontFamily: MONO, textTransform: 'none' }}>Save & continue</Button>
            <Button fullWidth disabled={busy} onClick={() => void finish(true)}
              sx={{ fontFamily: MONO, textTransform: 'none', color: 'text.secondary' }}>Skip</Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
