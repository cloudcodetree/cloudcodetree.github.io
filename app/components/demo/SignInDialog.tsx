'use client';

import { useState } from 'react';
import { Dialog, DialogContent, Typography, TextField, Button, Box, Divider, Alert } from '@mui/material';
import { GitHub, Google, LinkedIn, MailOutline } from '@mui/icons-material';
import { MONO, SERIF, ACCENT } from '../blogShared';
import { OAUTH_PROVIDERS, type OAuthProvider } from '../../lib/authConfig';
import { supabase } from '../../lib/supabaseClient';

const PROVIDER_UI: Record<OAuthProvider, { label: string; icon: React.ReactNode }> = {
  github: { label: 'Continue with GitHub', icon: <GitHub /> },
  google: { label: 'Continue with Google', icon: <Google /> },
  linkedin_oidc: { label: 'Continue with LinkedIn', icon: <LinkedIn /> },
};

export default function SignInDialog({
  open,
  onClose,
  projectTitle,
  nextPath,
}: {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
  nextPath: string;
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  // After auth, Supabase returns the visitor here; the page then mints the
  // HttpOnly cookie via /api/session and continues to `next`.
  const redirectTo = () =>
    `${window.location.origin}${window.location.pathname}?signin=1&next=${encodeURIComponent(nextPath)}`;

  const sendLink = async () => {
    setError(null);
    setState('sending');
    const { error: err } = await supabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (err) {
      setState('idle');
      setError(/rate/i.test(err.message) ? 'Too many requests — please try again in a few minutes.' : err.message);
    } else {
      setState('sent');
    }
  };

  const oauth = async (provider: OAuthProvider) => {
    setError(null);
    const { error: err } = await supabase().auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    });
    if (err) setError(err.message);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { background: '#2b2b2d', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 2 } }}>
      <DialogContent sx={{ p: 4 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase', mb: 1 }}>
          Live demo
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: '1.5rem', fontWeight: 600, mb: 1 }}>
          Sign in to run {projectTitle}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 3 }}>
          One click — no password, no spam. Just so I know who&apos;s trying my work.
        </Typography>

        {state === 'sent' ? (
          <Alert severity="success" sx={{ background: 'rgba(148,188,227,0.1)', color: 'text.primary' }}>
            Check your inbox — the sign-in link continues straight to the demo.
          </Alert>
        ) : (
          <>
            {OAUTH_PROVIDERS.length > 0 && (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {OAUTH_PROVIDERS.map((provider) => {
                    const { label, icon } = PROVIDER_UI[provider];
                    return (
                      <Button key={provider} fullWidth variant="outlined" startIcon={icon} onClick={() => void oauth(provider)}
                        sx={{ fontFamily: MONO, textTransform: 'none', color: 'text.primary', borderColor: 'rgba(148,163,184,0.3)', py: 1.2, '&:hover': { borderColor: ACCENT } }}>
                        {label}
                      </Button>
                    );
                  })}
                </Box>
                <Divider sx={{ my: 2.5, fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>or</Divider>
              </>
            )}
            <Box component="form" onSubmit={(e) => { e.preventDefault(); void sendLink(); }}
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                fullWidth size="small" type="email" required
                id="signin-email" name="email" autoComplete="email"
                label="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state === 'sending'}
              />
              <Button type="submit" fullWidth variant="contained" startIcon={<MailOutline />}
                disabled={state === 'sending' || !email}
                sx={{ fontFamily: MONO, textTransform: 'none', py: 1.2 }}>
                {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
              </Button>
            </Box>
          </>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
    </Dialog>
  );
}
