import { useEffect, useState } from 'react';
import { PlatformLoginPage } from './platform-login-page';
import { PlatformShell } from './platform-shell';
import { readStoredPlatformSession, writeStoredPlatformSession } from './platform-session-storage';
import type { PlatformSession } from './platform-types';

interface PlatformAppProps {
  onBackHome: () => void;
  onMerchantLogin: () => void;
}

export function PlatformApp({ onBackHome, onMerchantLogin }: PlatformAppProps) {
  const [session, setSession] = useState<PlatformSession | null>(() => readStoredPlatformSession());

  useEffect(() => {
    writeStoredPlatformSession(session);
  }, [session]);

  if (!session) {
    return (
      <PlatformLoginPage
        onLoggedIn={setSession}
        onBackHome={onBackHome}
        onMerchantLogin={onMerchantLogin}
      />
    );
  }

  return (
    <PlatformShell
      session={session}
      onSessionUpdate={setSession}
      onSignedOut={() => setSession(null)}
    />
  );
}
