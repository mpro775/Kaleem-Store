import Image from 'next/image';
import Link from 'next/link';
import type { StorefrontCategory, StorefrontProduct } from '../lib/types';

interface ThemeSectionsProps {
  storeName: string;
  sections: unknown[];
  categories: StorefrontCategory[];
  featuredProducts: StorefrontProduct[];
}

interface ThemeSection {
  id: string;
  type: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export function ThemeSections({
  storeName,
  sections,
  categories,
  featuredProducts,
}: ThemeSectionsProps) {
  const normalizedSections = sections
    .map((section, index) => normalizeSection(section, index))
    .filter((section): section is ThemeSection => section !== null)
    .filter((section) => section.enabled);

  return (
    <>
      {normalizedSections.map((section) => (
        <section key={section.id} className="section">
          {renderSection(section, { storeName, categories, featuredProducts })}
        </section>
      ))}
    </>
  );
}

function renderSection(
  section: ThemeSection,
  context: {
    storeName: string;
    categories: StorefrontCategory[];
    featuredProducts: StorefrontProduct[];
  },
) {
  switch (section.type) {
    case 'header':
      return <HeaderSection storeName={context.storeName} />;
    case 'hero':
      return <HeroSection storeName={context.storeName} settings={section.settings} />;
    case 'categories_grid':
      return <CategoriesSection categories={context.categories} />;
    case 'featured_products':
      return <FeaturedProductsSection products={context.featuredProducts} />;
    case 'offers_banner':
      return <OffersBannerSection />;
    case 'footer':
      return <FooterSection storeName={context.storeName} />;
    default:
      return <SectionFallback type={section.type} />;
  }
}

function HeaderSection({ storeName }: { storeName: string }) {
  return (
    <header className="header-panel">
      <p className="overline">Kaleem Store</p>
      <h2>{storeName}</h2>
      <nav className="header-links">
        <Link href="/categories">Categories</Link>
        <Link href="/cart">Cart</Link>
        <Link href="/track-order">Track order</Link>
      </nav>
    </header>
  );
}

function HeroSection({
  storeName,
  settings,
}: {
  storeName: string;
  settings: Record<string, unknown>;
}) {
  const headline =
    typeof settings.headline === 'string' ? settings.headline : `Discover ${storeName}`;
  return (
    <div className="hero-panel">
      <p className="overline">Fresh arrivals</p>
      <h1>{headline}</h1>
      <p>Order online with a fast checkout flow designed for mobile shoppers.</p>
      <div className="hero-actions">
        <Link href="/categories" className="button-primary">
          Browse products
        </Link>
        <Link href="/track-order" className="button-secondary">
          Track your order
        </Link>
      </div>
    </div>
  );
}

function CategoriesSection({ categories }: { categories: StorefrontCategory[] }) {
  return (
    <div>
      <h3>Shop by category</h3>
      <div className="category-grid">
        {categories.slice(0, 8).map((category) => (
          <Link
            key={category.id}
            href={`/categories?category=${encodeURIComponent(category.slug)}`}
            className="category-card"
          >
            <strong>{category.name}</strong>
            <span>{category.description ?? 'Explore the latest products'}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeaturedProductsSection({ products }: { products: StorefrontProduct[] }) {
  return (
    <div>
      <h3>Featured products</h3>
      <div className="product-grid">
        {products.slice(0, 8).map((product) => (
          <Link
            key={product.id}
            href={`/products/${encodeURIComponent(product.slug)}`}
            className="product-card"
          >
            <div className="product-image-shell">
              {product.primaryImageUrl ? (
                <Image
                  src={product.primaryImageUrl}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : (
                <div className="image-fallback">No image</div>
              )}
            </div>
            <strong>{product.title}</strong>
            <span>
              {product.priceFrom ? `From ${product.priceFrom.toFixed(2)}` : 'Price on request'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function OffersBannerSection() {
  return (
    <div className="offers-banner">
      <p className="overline">Offers</p>
      <h3>Cash on delivery and bank transfer</h3>
      <p>Checkout supports local payment flows with clear order tracking.</p>
    </div>
  );
}

function FooterSection({ storeName }: { storeName: string }) {
  return <footer className="footer-panel">{storeName} - Built with Kaleem Storefront</footer>;
}

function SectionFallback({ type }: { type: string }) {
  return <div className="section-fallback">Section type `{type}` is not available yet.</div>;
}

function normalizeSection(value: unknown, index: number): ThemeSection | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.type !== 'string') {
    return null;
  }

  const id =
    typeof value.id === 'string' && value.id.trim().length > 0 ? value.id : `section-${index}`;
  const enabled = value.enabled !== false;
  const settings = isRecord(value.settings) ? value.settings : {};

  return {
    id,
    type: value.type,
    enabled,
    settings,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
