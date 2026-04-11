import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AnalyticsPageView } from '../../components/analytics-page-view';
import { listCategories, listFilterAttributes, listProducts } from '../../lib/storefront-server';
import type { StorefrontFilterAttribute } from '../../lib/types';
import { absoluteUrl } from '../../lib/seo';

function bilingual(ar: string | null | undefined, en: string | null | undefined, fallback: string): string {
  if (ar && en) return `${ar} / ${en}`;
  return ar ?? en ?? fallback;
}

export const dynamic = 'force-dynamic';

interface CategoriesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: CategoriesPageProps): Promise<Metadata> {
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedCategory = readSingleSearchParam(resolvedParams, 'category');
  const query = readSingleSearchParam(resolvedParams, 'q');

  const titleBase = selectedCategory ? `Categories - ${selectedCategory}` : 'Categories';
  const title = query ? `${titleBase} | Search: ${query}` : titleBase;
  const description = selectedCategory
    ? `Browse products in ${selectedCategory} and discover top picks with filters.`
    : 'Browse categories with advanced filters and fast product discovery.';

  const params = new URLSearchParams();
  if (selectedCategory) {
    params.set('category', selectedCategory);
  }
  if (query) {
    params.set('q', query);
  }

  const canonicalPath = params.size > 0 ? `/categories?${params.toString()}` : '/categories';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: await absoluteUrl(canonicalPath),
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const selectedCategory = readSingleSearchParam(resolvedParams, 'category');
  const query = readSingleSearchParam(resolvedParams, 'q');
  const page = normalizePage(readSingleSearchParam(resolvedParams, 'page'));
  const attributeFilters = parseAttributeFilters(resolvedParams);
  const limit = 12;

  const [categories, products, filterAttributes] = await Promise.all([
    listCategories(),
    listProducts(
      buildProductQuery({
        page,
        limit,
        categorySlug: selectedCategory,
        query,
        attributeFilters,
      }),
    ),
    listFilterAttributes(selectedCategory ? { categorySlug: selectedCategory } : {}),
  ]);

  const totalPages = Math.max(1, Math.ceil(products.total / limit));
  const pageUrl = buildPageHref(page, selectedCategory, query, attributeFilters);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Categories',
    url: await absoluteUrl(pageUrl),
    isPartOf: {
      '@type': 'WebSite',
      url: await absoluteUrl('/'),
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: await absoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Categories',
          item: await absoluteUrl('/categories'),
        },
      ],
    },
  };

  return (
    <main className="page-shell stack-lg">
      <AnalyticsPageView
        eventName="sf_category_viewed"
        metadata={{
          category: selectedCategory ?? null,
          query: query ?? null,
          page,
          resultCount: products.total,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="page-header">
        <h1>Categories</h1>
        <p>Browse products with quick filters and pagination.</p>
      </header>

      <CategoryTabs categories={categories} selectedCategory={selectedCategory} />
      <SearchPanel
        selectedCategory={selectedCategory}
        query={query}
        attributeFilters={attributeFilters}
      />
      <AttributeFiltersPanel
        attributes={filterAttributes}
        selectedCategory={selectedCategory}
        query={query}
        selectedFilters={attributeFilters}
      />
      <ProductsGrid products={products.items} />
      <PaginationControls
        page={page}
        totalPages={totalPages}
        selectedCategory={selectedCategory}
        query={query}
        attributeFilters={attributeFilters}
      />
    </main>
  );
}

function CategoryTabs({
  categories,
  selectedCategory,
}: {
  categories: Array<{ id: string; slug: string; name: string; nameAr: string | null; nameEn: string | null; imageUrl: string | null }>;
  selectedCategory: string | undefined;
}) {
  return (
    <section className="panel category-tabs">
      <Link href="/categories" className={!selectedCategory ? 'tab active' : 'tab'}>
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories?category=${encodeURIComponent(category.slug)}`}
          className={selectedCategory === category.slug ? 'tab active' : 'tab'}
        >
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt={bilingual(category.nameAr, category.nameEn, category.name)}
              width={20}
              height={20}
              className="category-tab-icon"
            />
          ) : null}
          {bilingual(category.nameAr, category.nameEn, category.name)}
        </Link>
      ))}
    </section>
  );
}

function SearchPanel({
  selectedCategory,
  query,
  attributeFilters,
}: {
  selectedCategory: string | undefined;
  query: string | undefined;
  attributeFilters: Record<string, string[]>;
}) {
  return (
    <form className="panel" method="get" action="/categories">
      {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
      {renderAttributeHiddenInputs(attributeFilters)}
      <div className="search-row">
        <input
          id="product-search"
          aria-label="Search products"
          className="input"
          type="search"
          name="q"
          defaultValue={query ?? ''}
          placeholder="Search products"
        />
        <button className="button-primary" type="submit">
          Filter
        </button>
      </div>
    </form>
  );
}

function AttributeFiltersPanel({
  attributes,
  selectedCategory,
  query,
  selectedFilters,
}: {
  attributes: StorefrontFilterAttribute[];
  selectedCategory: string | undefined;
  query: string | undefined;
  selectedFilters: Record<string, string[]>;
}) {
  if (attributes.length === 0) {
    return null;
  }

  return (
    <form className="panel stack-md" method="get" action="/categories">
      {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
      {query ? <input type="hidden" name="q" value={query} /> : null}
      <h3>Filter by attributes</h3>
      {attributes.map((attribute) => (
        <fieldset key={attribute.id} className="panel">
          <legend>{bilingual(attribute.nameAr, attribute.nameEn, attribute.name)}</legend>
          <div className="stack-md">
            {attribute.values.map((value) => (
              <label key={value.id} className="inline-check">
                <input
                  type="checkbox"
                  name={`attrs[${attribute.slug}]`}
                  value={value.slug}
                  defaultChecked={Boolean(selectedFilters[attribute.slug]?.includes(value.slug))}
                />
                {bilingual(value.valueAr, value.valueEn, value.value)}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="actions">
        <button className="button-primary" type="submit">
          Apply Attribute Filters
        </button>
        <Link className="button-secondary" href={buildPageHref(1, selectedCategory, query, {})}>
          Clear Attribute Filters
        </Link>
      </div>
    </form>
  );
}

function ProductsGrid({
  products,
}: {
  products: Array<{
    id: string;
    slug: string;
    title: string;
    titleAr: string | null;
    titleEn: string | null;
    primaryImageUrl: string | null;
    priceFrom: number | null;
    isFeatured: boolean;
    ratingAvg: number;
    ratingCount: number;
  }>;
}) {
  if (products.length === 0) {
    return <div className="panel">No products found for this filter.</div>;
  }

  return (
    <section className="product-grid">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${encodeURIComponent(product.slug)}`}
          className="product-card"
        >
          <div className="product-image-shell">
            {product.primaryImageUrl ? (
              <Image
                src={product.primaryImageUrl}
                alt={bilingual(product.titleAr, product.titleEn, product.title)}
                fill
                sizes="(max-width: 768px) 100vw, 280px"
              />
            ) : (
              <div className="image-fallback">No image</div>
            )}
            {product.isFeatured ? <span className="badge-featured">مميز</span> : null}
          </div>
          <strong>{bilingual(product.titleAr, product.titleEn, product.title)}</strong>
          {product.ratingCount > 0 ? (
            <span className="product-rating-sm" aria-label={`Rating ${product.ratingAvg.toFixed(1)} out of 5`}>
              {'★'.repeat(Math.min(Math.round(product.ratingAvg), 5))}
              {'☆'.repeat(Math.max(5 - Math.round(product.ratingAvg), 0))}
              {' '}({product.ratingCount})
            </span>
          ) : null}
          <span>
            {product.priceFrom ? `From ${product.priceFrom.toFixed(2)}` : 'Price on request'}
          </span>
        </Link>
      ))}
    </section>
  );
}

function PaginationControls({
  page,
  totalPages,
  selectedCategory,
  query,
  attributeFilters,
}: {
  page: number;
  totalPages: number;
  selectedCategory: string | undefined;
  query: string | undefined;
  attributeFilters: Record<string, string[]>;
}) {
  return (
    <footer className="pagination" aria-label="Pagination navigation">
      <Link
        className={page <= 1 ? 'button-secondary disabled' : 'button-secondary'}
        href={buildPageHref(page - 1, selectedCategory, query, attributeFilters)}
        aria-disabled={page <= 1}
      >
        Previous
      </Link>
      <span>
        Page {page} of {totalPages}
      </span>
      <Link
        className={page >= totalPages ? 'button-secondary disabled' : 'button-secondary'}
        href={buildPageHref(page + 1, selectedCategory, query, attributeFilters)}
        aria-disabled={page >= totalPages}
      >
        Next
      </Link>
    </footer>
  );
}

function normalizePage(page: string | undefined): number {
  const parsed = Number(page ?? '1');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildProductQuery(input: {
  page: number;
  limit: number;
  categorySlug: string | undefined;
  query: string | undefined;
  attributeFilters: Record<string, string[]>;
}): {
  page: number;
  limit: number;
  categorySlug?: string;
  q?: string;
  attrs?: Record<string, string[]>;
} {
  const productQuery: {
    page: number;
    limit: number;
    categorySlug?: string;
    q?: string;
    attrs?: Record<string, string[]>;
  } = {
    page: input.page,
    limit: input.limit,
  };

  if (input.categorySlug) {
    productQuery.categorySlug = input.categorySlug;
  }
  if (input.query) {
    productQuery.q = input.query;
  }
  if (Object.keys(input.attributeFilters).length > 0) {
    productQuery.attrs = input.attributeFilters;
  }

  return productQuery;
}

function buildPageHref(
  page: number,
  category: string | undefined,
  q: string | undefined,
  attributeFilters: Record<string, string[]>,
): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (category) {
    params.set('category', category);
  }
  if (q) {
    params.set('q', q);
  }

  for (const [attributeSlug, values] of Object.entries(attributeFilters)) {
    for (const value of values) {
      params.append(`attrs[${attributeSlug}]`, value);
    }
  }

  return `/categories?${params.toString()}`;
}

function readSingleSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0]?.trim();
  }

  return typeof value === 'string' ? value.trim() : undefined;
}

function parseAttributeFilters(
  params: Record<string, string | string[] | undefined>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  for (const [key, rawValue] of Object.entries(params)) {
    const attributeSlug = parseAttributeKey(key);
    if (!attributeSlug) {
      continue;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    const normalizedValues = values
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);

    if (normalizedValues.length > 0) {
      filters[attributeSlug] = [...new Set(normalizedValues)];
    }
  }

  return filters;
}

function parseAttributeKey(key: string): string | null {
  const match = /^attrs\[([a-z0-9]+(?:-[a-z0-9]+)*)\]$/.exec(key);
  return match?.[1] ?? null;
}

function renderAttributeHiddenInputs(attributeFilters: Record<string, string[]>) {
  return Object.entries(attributeFilters).flatMap(([attributeSlug, values]) =>
    values.map((value) => (
      <input
        key={`${attributeSlug}:${value}`}
        type="hidden"
        name={`attrs[${attributeSlug}]`}
        value={value}
      />
    )),
  );
}
