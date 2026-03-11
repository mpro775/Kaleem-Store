import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPolicies, resolveStore } from '../../../lib/storefront-server';

type PolicyKey = 'shipping' | 'return' | 'privacy' | 'terms';

const POLICY_LABELS: Record<PolicyKey, string> = {
  shipping: 'Shipping Policy',
  return: 'Return Policy',
  privacy: 'Privacy Policy',
  terms: 'Terms and Conditions',
};

export const dynamic = 'force-dynamic';

export default async function PolicyPage({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  if (!isPolicyKey(policy)) {
    notFound();
  }

  const [store, policies] = await Promise.all([resolveStore(), getPolicies()]);
  const content = getPolicyContent(policy, policies);

  return (
    <main className="page-shell">
      <section className="section card">
        <p className="overline">{store.storeSettings.name}</p>
        <h1>{POLICY_LABELS[policy]}</h1>
        <p>
          <Link href="/">Back to home</Link>
        </p>
        <article>
          {content ? <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p> : <p>Policy not set yet.</p>}
        </article>
      </section>
    </main>
  );
}

function isPolicyKey(value: string): value is PolicyKey {
  return value === 'shipping' || value === 'return' || value === 'privacy' || value === 'terms';
}

function getPolicyContent(
  key: PolicyKey,
  policies: {
    shippingPolicy: string | null;
    returnPolicy: string | null;
    privacyPolicy: string | null;
    termsAndConditions: string | null;
  },
): string | null {
  switch (key) {
    case 'shipping':
      return policies.shippingPolicy;
    case 'return':
      return policies.returnPolicy;
    case 'privacy':
      return policies.privacyPolicy;
    case 'terms':
      return policies.termsAndConditions;
    default:
      return null;
  }
}
