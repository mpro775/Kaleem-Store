import { MerchantDashboard } from './merchant-dashboard';
import { MerchantLogin } from './merchant-login';
import { useMerchantSession } from './use-merchant-session';

export function MerchantApp() {
  const [session, setSession] = useMerchantSession();

  if (!session) {
    return <MerchantLogin onLoggedIn={setSession} />;
  }

  return (
    <MerchantDashboard
      session={session}
      onSessionUpdate={setSession}
      onSignedOut={() => setSession(null)}
    />
  );
}
