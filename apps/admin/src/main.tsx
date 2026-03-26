import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { App } from './App';
import theme from './theme/theme';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'ar');
document.body.setAttribute('dir', 'rtl');

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  </StrictMode>,
);