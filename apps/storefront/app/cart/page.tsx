import type { Metadata } from 'next';
import { CartPageClient } from '../../components/cart-page-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review your selected products before checkout.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return <CartPageClient />;
}
