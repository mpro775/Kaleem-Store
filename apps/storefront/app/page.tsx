import type { Metadata } from 'next';
import { AnalyticsPageView } from '../components/analytics-page-view';
import { ThemeSections } from '../components/theme-sections';
import {
  getPublishedTheme,
  listCategories,
  listProducts,
  resolveStore,
} from '../lib/storefront-server';
import { absoluteUrl, cleanText } from '../lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const store = await resolveStore();
  const title = `${store.storeSettings.name} | Home`;
  const description = `تسوق أحدث المنتجات من ${store.storeSettings.name} مع تجربة شراء سريعة وآمنة.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: await absoluteUrl('/'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Page() {
  const [store, theme, categories, featuredProducts] = await Promise.all([
    resolveStore(),
    getPublishedTheme(),
    listCategories(),
    listProducts({ limit: 8, page: 1 }),
  ]);

  const sections = Array.isArray(theme.config.sections) ? theme.config.sections : [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: cleanText(store.storeSettings.name, 'Kaleem Storefront'),
    url: await absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${await absoluteUrl('/categories')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main className="page-shell">
      <AnalyticsPageView eventName="sf_home_viewed" metadata={{ page: 'home' }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThemeSections
        storeName={store.storeSettings.name}
        sections={sections}
        categories={categories}
        featuredProducts={featuredProducts.items}
      />
    </main>
  );
}
