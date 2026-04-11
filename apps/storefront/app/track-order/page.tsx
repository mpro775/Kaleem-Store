import type { Metadata } from 'next';
import { TrackOrderClient } from '../../components/track-order-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Track Order',
  description: 'Track your order status in real time.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
