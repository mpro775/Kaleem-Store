import { Box } from '@mui/material';
import { MarketingHero } from './components/marketing-hero';
import { MarketingNavbar } from './components/marketing-navbar';
import { MarketingSections } from './components/marketing-sections';

interface MarketingHomeProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
}

export function MarketingHome({ onCreateAccount, onSignIn }: MarketingHomeProps) {
  function trackAndCreateAccount(source: string): void {
    window.dispatchEvent(
      new CustomEvent('kaleem:cta', {
        detail: { page: 'marketing', action: 'create-account', source },
      }),
    );
    onCreateAccount();
  }

  function trackAndSignIn(source: string): void {
    window.dispatchEvent(
      new CustomEvent('kaleem:cta', {
        detail: { page: 'marketing', action: 'sign-in', source },
      }),
    );
    onSignIn();
  }

  return (
    <Box component="div" dir="rtl" sx={{ bgcolor: 'background.default' }}>
      <MarketingNavbar
        onCreateAccount={() => trackAndCreateAccount('navbar')}
        onSignIn={() => trackAndSignIn('navbar')}
      />

      <MarketingHero
        onCreateAccount={() => trackAndCreateAccount('hero-primary')}
        onSignIn={() => trackAndSignIn('hero-secondary')}
      />

      <MarketingSections
        onCreateAccount={() => trackAndCreateAccount('section-cta')}
        onSignIn={() => trackAndSignIn('section-signin')}
      />
    </Box>
  );
}
