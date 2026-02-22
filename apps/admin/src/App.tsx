import { useEffect, useState } from 'react';
import { MerchantApp } from './features/merchant/merchant-app';
import { PlatformConsole } from './features/platform-console';
import './styles.css';

type ConsoleMode = 'merchant' | 'platform';

function resolveMode(pathname: string): ConsoleMode {
  return pathname.startsWith('/merchant') ? 'merchant' : 'platform';
}

function resolvePath(mode: ConsoleMode): string {
  return mode === 'merchant' ? '/merchant' : '/platform';
}

export function App() {
  const [mode, setMode] = useState<ConsoleMode>(() => resolveMode(window.location.pathname));

  useEffect(() => {
    const nextMode = resolveMode(window.location.pathname);
    const expectedPath = resolvePath(nextMode);
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }

    const handlePopState = () => {
      setMode(resolveMode(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function navigate(nextMode: ConsoleMode): void {
    const nextPath = resolvePath(nextMode);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setMode(nextMode);
  }

  return (
    <main className="admin-shell">
      <header className="shell-header">
        <div>
          <h1>Kaleem Admin Hub</h1>
          <p>Production-style merchant dashboard with platform SaaS controls.</p>
          <p className="route-hint">Current route: {resolvePath(mode)}</p>
        </div>
        <nav className="mode-switcher" aria-label="Console selector">
          <button
            className={mode === 'platform' ? 'selected' : ''}
            onClick={() => navigate('platform')}
          >
            Platform Admin
          </button>
          <button
            className={mode === 'merchant' ? 'selected' : ''}
            onClick={() => navigate('merchant')}
          >
            Merchant Studio
          </button>
        </nav>
      </header>

      {mode === 'platform' ? <PlatformConsole /> : <MerchantApp />}
    </main>
  );
}
