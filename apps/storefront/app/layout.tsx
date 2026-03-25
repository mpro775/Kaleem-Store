import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { CustomerAuthProvider } from '../lib/customer-auth-context';
import { WishlistProvider } from '../lib/wishlist-context';
import { HeaderAuth } from '../components/header-auth';

export const metadata: Metadata = {
  title: {
    default: 'Kaleem Storefront',
    template: '%s | Kaleem Storefront',
  },
  description: 'Host-based multi-tenant storefront for Kaleem merchants',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <CustomerAuthProvider>
          <WishlistProvider>
            <div className="store-header-bar">
              <HeaderAuth />
            </div>
            {children}
          </WishlistProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
