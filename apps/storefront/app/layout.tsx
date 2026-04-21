import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import './globals.css';
import { CustomerAuthProvider } from '../lib/customer-auth-context';
import { WishlistProvider } from '../lib/wishlist-context';
import { HeaderAuth } from '../components/header-auth';
import { getPublishedTheme, resolveStore } from '../lib/storefront-server';
import { resolveThemeStyleVars } from '../lib/theme-runtime';
import { getSiteOrigin } from '../lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = new URL(await getSiteOrigin());
  let faviconUrl: string | null = null;

  try {
    const store = await resolveStore();
    faviconUrl = store.storeSettings.faviconUrl ?? null;
  } catch {
    faviconUrl = null;
  }

  return {
    metadataBase,
    title: {
      default: 'Kaleem Storefront',
      template: '%s | Kaleem Storefront',
    },
    description: 'Host-based multi-tenant storefront for Kaleem merchants',
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: 'Kaleem Storefront',
      description: 'Host-based multi-tenant storefront for Kaleem merchants',
      url: metadataBase,
      siteName: 'Kaleem Storefront',
      type: 'website',
      locale: 'ar_SA',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Kaleem Storefront',
      description: 'Host-based multi-tenant storefront for Kaleem merchants',
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(faviconUrl
      ? {
          icons: {
            icon: faviconUrl,
            shortcut: faviconUrl,
          },
        }
      : {}),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  let themeStyle: CSSProperties | undefined;

  try {
    const theme = await getPublishedTheme();
    themeStyle = resolveThemeStyleVars(theme.config) as CSSProperties;
  } catch {
    themeStyle = undefined;
  }

  return (
    <html lang="en">
      <body className="app-body" style={themeStyle}>
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
