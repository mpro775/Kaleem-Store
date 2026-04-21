/* eslint-disable complexity */
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
  const categories = await listCategories();
  const selectedCategoryData = selectedCategory
    ? categories.find((category) => category.slug === selectedCategory)
    : null;

  const selectedCategoryName = selectedCategoryData
    ? bilingual(selectedCategoryData.nameAr, selectedCategoryData.nameEn, selectedCategoryData.name)
    : selectedCategory;

  const seoTitle = selectedCategoryData
    ? selectedCategoryData.seoTitleAr ?? selectedCategoryData.seoTitleEn
    : null;
  const seoDescription = selectedCategoryData
    ? selectedCategoryData.seoDescriptionAr ?? selectedCategoryData.seoDescriptionEn
    : null;

  const titleBase = seoTitle ?? (selectedCategoryName ? `Categories - ${selectedCategoryName}` : 'Categories');
  const title = query ? `${titleBase} | Search: ${query}` : titleBase;
  const description =
    seoDescription ??
    (selectedCategoryName
      ? `Browse products in ${selectedCategoryName} and discover top picks with filters.`
      : 'Browse categories with advanced filters and fast product discovery.');

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
  const valueFilters = parseValueFilters(resolvedParams);
  const rangeFilters = parseRangeFilters(resolvedParams);
  const limit = 12;

  const [categories, products, filterAttributes] = await Promise.all([
    listCategories(),
    listProducts(
      buildProductQuery({
        page,
        limit,
        categorySlug: selectedCategory,
        query,
        valueFilters,
        rangeFilters,
      }),
    ),
    listFilterAttributes(selectedCategory ? { categorySlug: selectedCategory } : {}),
  ]);

  const totalPages = Math.max(1, Math.ceil(products.total / limit));
  const selectedCategoryData = selectedCategory
    ? categories.find((category) => category.slug === selectedCategory)
    : null;
  const pageTitle = selectedCategoryData
    ? bilingual(selectedCategoryData.nameAr, selectedCategoryData.nameEn, selectedCategoryData.name)
    : 'Categories';
  const pageDescription = selectedCategoryData
    ? bilingual(
        selectedCategoryData.descriptionAr,
        selectedCategoryData.descriptionEn,
        selectedCategoryData.description ?? 'Browse products with quick filters and pagination.',
      )
    : 'Browse products with quick filters and pagination.';
  const pageUrl = buildPageHref(page, selectedCategory, query, valueFilters, rangeFilters);
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
        {selectedCategoryData?.backgroundImageUrl ? (
          <Image
            src={selectedCategoryData.backgroundImageUrl}
            alt={selectedCategoryData.imageAltAr ?? selectedCategoryData.imageAltEn ?? pageTitle}
            width={1400}
            height={360}
            style={{ width: '100%', height: 'auto', borderRadius: '16px', marginBottom: '0.8rem' }}
            priority
          />
        ) : null}
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>
      </header>

      <CategoryTabs categories={categories} selectedCategory={selectedCategory} />
      <SearchPanel
        selectedCategory={selectedCategory}
        query={query}
        valueFilters={valueFilters}
        rangeFilters={rangeFilters}
      />
      <AttributeFiltersPanel
        attributes={filterAttributes}
        selectedCategory={selectedCategory}
        query={query}
        selectedValueFilters={valueFilters}
        selectedRangeFilters={rangeFilters}
      />
      <ProductsGrid products={products.items} />
      <PaginationControls
        page={page}
        totalPages={totalPages}
        selectedCategory={selectedCategory}
        query={query}
        valueFilters={valueFilters}
        rangeFilters={rangeFilters}
      />
    </main>
  );
}

function CategoryTabs({
  categories,
  selectedCategory,
}: {
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    nameAr: string | null;
    nameEn: string | null;
    imageUrl: string | null;
    imageAltAr: string | null;
    imageAltEn: string | null;
  }>;
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
              alt={category.imageAltAr ?? category.imageAltEn ?? bilingual(category.nameAr, category.nameEn, category.name)}
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
  valueFilters,
  rangeFilters,
}: {
  selectedCategory: string | undefined;
  query: string | undefined;
  valueFilters: Record<string, string[]>;
  rangeFilters: Record<string, { min?: number; max?: number }>;
}) {
  return (
    <form className="panel" method="get" action="/categories">
      {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
      {renderValueHiddenInputs(valueFilters)}
      {renderRangeHiddenInputs(rangeFilters)}
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
  selectedValueFilters,
  selectedRangeFilters,
}: {
  attributes: StorefrontFilterAttribute[];
  selectedCategory: string | undefined;
  query: string | undefined;
  selectedValueFilters: Record<string, string[]>;
  selectedRangeFilters: Record<string, { min?: number; max?: number }>;
}) {
  if (attributes.length === 0) {
    return null;
  }

  return (
    <form className="panel stack-md" method="get" action="/categories">
      {selectedCategory ? <input type="hidden" name="category" value={selectedCategory} /> : null}
      {query ? <input type="hidden" name="q" value={query} /> : null}
      <h3>Filter by options</h3>
      {attributes.map((filter) => (
        <fieldset key={filter.id} className="panel">
          <legend>{bilingual(filter.nameAr, filter.nameEn, filter.nameAr)}</legend>
          {filter.type === 'range' ? (
            <div className="search-row">
              <input
                className="input"
                type="number"
                step="0.01"
                min={0}
                name={`ranges[${filter.slug}][min]`}
                defaultValue={selectedRangeFilters[filter.slug]?.min ?? ''}
                placeholder="Min"
              />
              <input
                className="input"
                type="number"
                step="0.01"
                min={0}
                name={`ranges[${filter.slug}][max]`}
                defaultValue={selectedRangeFilters[filter.slug]?.max ?? ''}
                placeholder="Max"
              />
            </div>
          ) : (
            <div className="stack-md">
              {filter.values.map((value) => {
                const checked = Boolean(selectedValueFilters[filter.slug]?.includes(value.slug));
                const inputType = filter.type === 'radio' ? 'radio' : 'checkbox';

                return (
                  <label key={value.id} className="inline-check">
                    <input
                      type={inputType}
                      name={`filters[${filter.slug}]`}
                      value={value.slug}
                      defaultChecked={checked}
                    />
                    {filter.type === 'color' && value.colorHex ? (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          display: 'inline-block',
                          border: '1px solid #ddd',
                          backgroundColor: value.colorHex,
                          marginInlineStart: 4,
                        }}
                      />
                    ) : null}
                    {bilingual(value.valueAr, value.valueEn, value.valueAr)}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      ))}
      <div className="actions">
        <button className="button-primary" type="submit">
          Apply Filters
        </button>
        <Link className="button-secondary" href={buildPageHref(1, selectedCategory, query, {}, {})}>
          Clear Filters
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
            {product.isFeatured ? <span className="badge-featured">Featured</span> : null}
          </div>
          <strong>{bilingual(product.titleAr, product.titleEn, product.title)}</strong>
          {product.ratingCount > 0 ? (
            <span className="product-rating-sm" aria-label={`Rating ${product.ratingAvg.toFixed(1)} out of 5`}>
              {'*'.repeat(Math.min(Math.round(product.ratingAvg), 5))}
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
  valueFilters,
  rangeFilters,
}: {
  page: number;
  totalPages: number;
  selectedCategory: string | undefined;
  query: string | undefined;
  valueFilters: Record<string, string[]>;
  rangeFilters: Record<string, { min?: number; max?: number }>;
}) {
  return (
    <footer className="pagination" aria-label="Pagination navigation">
      <Link
        className={page <= 1 ? 'button-secondary disabled' : 'button-secondary'}
        href={buildPageHref(page - 1, selectedCategory, query, valueFilters, rangeFilters)}
        aria-disabled={page <= 1}
      >
        Previous
      </Link>
      <span>
        Page {page} of {totalPages}
      </span>
      <Link
        className={page >= totalPages ? 'button-secondary disabled' : 'button-secondary'}
        href={buildPageHref(page + 1, selectedCategory, query, valueFilters, rangeFilters)}
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
  valueFilters: Record<string, string[]>;
  rangeFilters: Record<string, { min?: number; max?: number }>;
}): {
  page: number;
  limit: number;
  categorySlug?: string;
  q?: string;
  filters?: Record<string, string[]>;
  ranges?: Record<string, { min?: number; max?: number }>;
} {
  const productQuery: {
    page: number;
    limit: number;
    categorySlug?: string;
    q?: string;
    filters?: Record<string, string[]>;
    ranges?: Record<string, { min?: number; max?: number }>;
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
  if (Object.keys(input.valueFilters).length > 0) {
    productQuery.filters = input.valueFilters;
  }
  if (Object.keys(input.rangeFilters).length > 0) {
    productQuery.ranges = input.rangeFilters;
  }

  return productQuery;
}

function buildPageHref(
  page: number,
  category: string | undefined,
  q: string | undefined,
  valueFilters: Record<string, string[]>,
  rangeFilters: Record<string, { min?: number; max?: number }>,
): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (category) {
    params.set('category', category);
  }
  if (q) {
    params.set('q', q);
  }

  for (const [filterSlug, values] of Object.entries(valueFilters)) {
    for (const value of values) {
      params.append(`filters[${filterSlug}]`, value);
    }
  }

  for (const [filterSlug, range] of Object.entries(rangeFilters)) {
    if (range.min !== undefined) {
      params.append(`ranges[${filterSlug}][min]`, String(range.min));
    }
    if (range.max !== undefined) {
      params.append(`ranges[${filterSlug}][max]`, String(range.max));
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

function parseValueFilters(
  params: Record<string, string | string[] | undefined>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  for (const [key, rawValue] of Object.entries(params)) {
    const filterSlug = parseValueFilterKey(key);
    if (!filterSlug) {
      continue;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    const normalizedValues = values
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);

    if (normalizedValues.length > 0) {
      filters[filterSlug] = [...new Set(normalizedValues)];
    }
  }

  return filters;
}

function parseRangeFilters(
  params: Record<string, string | string[] | undefined>,
): Record<string, { min?: number; max?: number }> {
  const ranges: Record<string, { min?: number; max?: number }> = {};
  for (const [key, rawValue] of Object.entries(params)) {
    const parsed = parseRangeFilterKey(key);
    if (!parsed) {
      continue;
    }

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (typeof value !== 'string' || value.trim().length === 0) {
      continue;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      continue;
    }

    const current = ranges[parsed.slug] ?? {};
    current[parsed.boundary] = numeric;
    ranges[parsed.slug] = current;
  }

  return ranges;
}

function parseValueFilterKey(key: string): string | null {
  const match = /^filters\[([a-z0-9]+(?:-[a-z0-9]+)*)\]$/i.exec(key);
  return match?.[1]?.toLowerCase() ?? null;
}

function parseRangeFilterKey(key: string): { slug: string; boundary: 'min' | 'max' } | null {
  const match = /^ranges\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\[(min|max)\]$/i.exec(key);
  if (!match) {
    return null;
  }

  return {
    slug: match[1].toLowerCase(),
    boundary: match[2].toLowerCase() as 'min' | 'max',
  };
}

function renderValueHiddenInputs(valueFilters: Record<string, string[]>) {
  return Object.entries(valueFilters).flatMap(([filterSlug, values]) =>
    values.map((value) => (
      <input
        key={`${filterSlug}:${value}`}
        type="hidden"
        name={`filters[${filterSlug}]`}
        value={value}
      />
    )),
  );
}

function renderRangeHiddenInputs(rangeFilters: Record<string, { min?: number; max?: number }>) {
  return Object.entries(rangeFilters).flatMap(([filterSlug, range]) => {
    const inputs: ReactNode[] = [];
    if (range.min !== undefined) {
      inputs.push(
        <input
          key={`${filterSlug}:min`}
          type="hidden"
          name={`ranges[${filterSlug}][min]`}
          value={String(range.min)}
        />,
      );
    }
    if (range.max !== undefined) {
      inputs.push(
        <input
          key={`${filterSlug}:max`}
          type="hidden"
          name={`ranges[${filterSlug}][max]`}
          value={String(range.max)}
        />,
      );
    }
    return inputs;
  });
}
