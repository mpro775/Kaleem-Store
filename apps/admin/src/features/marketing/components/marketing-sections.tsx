import { MarketingBenefits } from './marketing-benefits';
import { MarketingDomain } from './marketing-domain';
import { MarketingFaq } from './marketing-faq';
import { MarketingFeatures } from './marketing-features';
import { MarketingFinalCta } from './marketing-final-cta';
import { MarketingFooter } from './marketing-footer';
import { MarketingForWho } from './marketing-for-who';
import { MarketingHowItWorks } from './marketing-how-it-works';
import { MarketingPricing } from './marketing-pricing';
import { MarketingProblemSolution } from './marketing-problem-solution';
import { MarketingScreenshots } from './marketing-screenshots';
import { MarketingThemes } from './marketing-themes';

interface MarketingSectionsProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
}

export function MarketingSections({ onCreateAccount, onSignIn }: MarketingSectionsProps) {
  return (
    <>
      <MarketingProblemSolution />
      <MarketingForWho />
      <MarketingFeatures />
      <MarketingThemes />
      <MarketingDomain />
      <MarketingHowItWorks />
      <MarketingBenefits />
      <MarketingScreenshots />
      <MarketingPricing />
      <MarketingFaq />
      <MarketingFinalCta onCreateAccount={onCreateAccount} onSignIn={onSignIn} />
      <MarketingFooter onCreateAccount={onCreateAccount} onSignIn={onSignIn} />
    </>
  );
}
