'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { MotionConfig } from 'framer-motion';
import { darkTheme } from '../lib/theme';

/** The same provider tree renders on the server and during hydration. */
export default function ClientOnlyThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui-style' }}>
      <MuiThemeProvider theme={darkTheme}>
        <CssBaseline enableColorScheme />
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}
