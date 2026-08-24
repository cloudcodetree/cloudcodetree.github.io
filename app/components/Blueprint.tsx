'use client';

// The Industry system's wireframe frame: a hairline-bordered, square-cornered
// object wearing four "+" registration marks. Geometry from
// design/claude-design/industry/styles.css (.blueprint / .corner).

import { Box, type SxProps, type Theme } from '@mui/material';
import { industry } from '../lib/industryTokens';

/** Card-as-blueprint-object: transparent line drawing, never a filled block. */
export const blueprintSx: SxProps<Theme> = {
  position: 'relative',
  border: `1px solid ${industry.divider}`,
  borderRadius: 0,
  background: 'transparent',
};

/** Duotone image treatment — RETIRED by owner amendment 2026-08-24 ("images
 * all blue-hued"). Kept exported for possible selective use; apply nowhere
 * by default. */
export const duotoneSx: SxProps<Theme> = {
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: industry.accent[500],
    mixBlendMode: 'color',
  },
};

const mark = (pos: SxProps<Theme>): SxProps<Theme> => ({
  position: 'absolute',
  width: 11,
  height: 11,
  color: 'rgba(242,242,243,0.55)',
  pointerEvents: 'none',
  '&::before': {
    content: '""', position: 'absolute', background: 'currentColor',
    left: 5, top: 0, width: '1px', height: '100%',
  },
  '&::after': {
    content: '""', position: 'absolute', background: 'currentColor',
    top: 5, left: 0, width: '100%', height: '1px',
  },
  ...pos,
});

/** Drop inside any position:relative box (e.g. one carrying blueprintSx). */
export function Corners() {
  return (
    <>
      <Box component="i" sx={mark({ top: -6, left: -6 })} />
      <Box component="i" sx={mark({ top: -6, right: -6 })} />
      <Box component="i" sx={mark({ bottom: -6, left: -6 })} />
      <Box component="i" sx={mark({ bottom: -6, right: -6 })} />
    </>
  );
}

/** react-markdown `pre` renderer: the board draws code blocks as blueprint
 * objects — hairline frame, corner marks, faint ink-tint fill. */
export function BlueprintPre(props: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <Box sx={{ ...blueprintSx, background: 'rgba(242,242,243,0.05)', p: 2, mb: 2, overflowX: 'auto' }}>
      <Corners />
      <Box
        component="pre"
        {...props}
        sx={{ m: 0, p: 0, background: 'none', fontSize: { xs: '0.78rem', md: '0.875rem' }, lineHeight: 1.7,
          '& code': { whiteSpace: 'pre', overflowWrap: 'normal', wordBreak: 'normal', background: 'none', p: 0 } }}
      />
    </Box>
  );
}
