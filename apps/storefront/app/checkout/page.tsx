import type { Metadata } from 'next';
import { CheckoutPageClient } from '../../components/checkout-page-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase securely with fast order confirmation.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
