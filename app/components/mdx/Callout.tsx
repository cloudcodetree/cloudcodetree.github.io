import { Box } from '@mui/material';

const TONES = {
  tip: { border: '#3fb950', bg: 'rgba(63,185,80,0.08)', label: 'TIP' },
  note: { border: '#2f81f7', bg: 'rgba(47,129,247,0.08)', label: 'NOTE' },
  warn: { border: '#d29922', bg: 'rgba(210,153,34,0.08)', label: 'HEADS UP' },
} as const;

/** A styled callout box usable directly in .mdx: <Callout tone="tip">…</Callout> */
export default function Callout({
  tone = 'note',
  children,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <Box sx={{ my: 3, p: '14px 18px', borderRadius: 2, border: '1px solid #222a35', borderLeft: `3px solid ${t.border}`, background: t.bg }}>
      <Box sx={{ fontFamily: 'var(--font-plex-mono), monospace', fontSize: 11, letterSpacing: '0.08em', color: t.border, mb: 0.5 }}>{t.label}</Box>
      <Box sx={{ color: 'text.secondary', '& p': { m: 0 }, '& p + p': { mt: 1 } }}>{children}</Box>
    </Box>
  );
}
