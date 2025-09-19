'use client';

import { useEffect, useState } from 'react';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import createEmotionCache from '../lib/emotionCache';
import { darkTheme } from '../lib/theme';

const clientSideEmotionCache = createEmotionCache();

interface ClientOnlyThemeProviderProps {
  children: React.ReactNode;
}

export default function ClientOnlyThemeProvider({ children }: ClientOnlyThemeProviderProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{children}</>;
  }

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <MuiThemeProvider theme={darkTheme}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  );
}