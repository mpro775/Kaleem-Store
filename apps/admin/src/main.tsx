import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { App } from './App';
import { useLocalStorageState } from './lib/use-local-storage-state';
import { createAdminTheme } from './theme/theme';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'ar');
document.body.setAttribute('dir', 'rtl');

function Root() {
  const [themeMode, setThemeMode] = useLocalStorageState('admin.theme.mode.v1', 'light');

  const mode = themeMode === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => createAdminTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App themeMode={mode} onThemeModeChange={setThemeMode} />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <CacheProvider value={cacheRtl}>
      <Root />
    </CacheProvider>
  </StrictMode>,
);
