import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

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
      <body className="app-body">{children}</body>
    </html>
  );
}
