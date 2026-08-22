import { createTheme } from '@mui/material/styles';
import { industry } from './industryTokens';

// Industry direction on its dark ground — tokens from design/claude-design.
// Square corners, hairline borders, no glass blur; Barlow Condensed display
// over Barlow body (loaded via next/font in app/layout.tsx).
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: industry.accent[500] },
    secondary: { main: industry.accent[400] },
    background: {
      default: industry.ground,
      paper: industry.surface,
    },
    text: {
      primary: industry.ink,
      secondary: industry.inkSecondary,
    },
    divider: industry.divider,
  },
  shape: {
    // sx borderRadius values multiply this: keeps every rounded corner ≤ a few px.
    borderRadius: 1,
  },
  typography: {
    fontFamily: 'var(--font-body), system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: 'var(--font-display), system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '3.5rem',
      letterSpacing: '-0.01em',
      '@media (max-width:600px)': { fontSize: '2.5rem' },
    },
    h2: {
      fontFamily: 'var(--font-display), system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '2.5rem',
      '@media (max-width:600px)': { fontSize: '2rem' },
    },
    h3: {
      fontFamily: 'var(--font-display), system-ui, sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      '@media (max-width:600px)': { fontSize: '1.5rem' },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: 'var(--font-display), system-ui, sans-serif',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          // Blueprint object: flat, square, hairline-bordered — never glass.
          borderRadius: 0,
          background: 'transparent',
          border: `1px solid ${industry.divider}`,
        },
      },
    },
  },
});
