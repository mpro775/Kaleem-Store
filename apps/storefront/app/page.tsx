import { ThemeSections } from '../components/theme-sections';
import {
  getPublishedTheme,
  listCategories,
  listProducts,
  resolveStore,
} from '../lib/storefront-server';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [store, theme, categories, featuredProducts] = await Promise.all([
    resolveStore(),
    getPublishedTheme(),
    listCategories(),
    listProducts({ limit: 8, page: 1 }),
  ]);

  const sections = Array.isArray(theme.config.sections) ? theme.config.sections : [];

  return (
    <main className="page-shell">
      <ThemeSections
        storeName={store.storeSettings.name}
        sections={sections}
        categories={categories}
        featuredProducts={featuredProducts.items}
      />
    </main>
  );
}
