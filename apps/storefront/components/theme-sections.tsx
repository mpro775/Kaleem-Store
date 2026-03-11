import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
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
  const renderer = sectionRenderers[section.type];
  if (!renderer) {
    return <SectionFallback type={section.type} />;
  }

  return renderer(section, context);
}

const sectionRenderers: Record<
  string,
  (
    section: ThemeSection,
    context: {
      storeName: string;
      categories: StorefrontCategory[];
      featuredProducts: StorefrontProduct[];
    },
  ) => ReactNode
> = {
  announcement_bar: (section) => <AnnouncementBarSection settings={section.settings} />,
  header: (_section, context) => <HeaderSection storeName={context.storeName} />,
  hero: (section, context) => <HeroSection storeName={context.storeName} settings={section.settings} />,
  categories_grid: (_section, context) => <CategoriesSection categories={context.categories} />,
  featured_products: (_section, context) => (
    <FeaturedProductsSection products={context.featuredProducts} />
  ),
  rich_text: (section) => <RichTextSection settings={section.settings} />,
  testimonials: (section) => <TestimonialsSection settings={section.settings} />,
  newsletter_signup: (section) => <NewsletterSignupSection settings={section.settings} />,
  offers_banner: () => <OffersBannerSection />,
  footer: (_section, context) => <FooterSection storeName={context.storeName} />,
};

function AnnouncementBarSection({ settings }: { settings: Record<string, unknown> }) {
  const message =
    typeof settings.message === 'string' && settings.message.trim().length > 0
      ? settings.message
      : 'Welcome to our store';
  return <div className="offers-banner">{message}</div>;
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
        <Link href="/policies/privacy">Policies</Link>
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

function RichTextSection({ settings }: { settings: Record<string, unknown> }) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'About our store';
  const body =
    typeof settings.body === 'string' && settings.body.trim().length > 0
      ? settings.body
      : 'Curated products with reliable delivery and transparent support.';
  return (
    <div className="hero-panel">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function TestimonialsSection({ settings }: { settings: Record<string, unknown> }) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'Customer stories';

  const items = Array.isArray(settings.items)
    ? settings.items
        .map((item) => (isRecord(item) ? item : null))
        .filter((item): item is Record<string, unknown> => item !== null)
        .slice(0, 4)
    : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3>{title}</h3>
      <div className="category-grid">
        {items.map((item, index) => {
          const quote = typeof item.quote === 'string' ? item.quote : 'Great shopping experience.';
          const author = typeof item.author === 'string' ? item.author : 'Customer';
          return (
            <article key={`${author}-${index}`} className="category-card">
              <strong>{author}</strong>
              <span>{quote}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function NewsletterSignupSection({ settings }: { settings: Record<string, unknown> }) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'Get updates';
  const ctaLabel =
    typeof settings.ctaLabel === 'string' && settings.ctaLabel.trim().length > 0
      ? settings.ctaLabel
      : 'Join';
  return (
    <div className="hero-panel">
      <h3>{title}</h3>
      <p>Subscribe for new arrivals and limited offers.</p>
      <div className="actions">
        <button className="primary" type="button">
          {ctaLabel}
        </button>
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
  return (
    <footer className="footer-panel">
      <p>{storeName} - Built with Kaleem Storefront</p>
      <p>
        <Link href="/policies/shipping">Shipping policy</Link> |{' '}
        <Link href="/policies/return">Return policy</Link> |{' '}
        <Link href="/policies/privacy">Privacy policy</Link> |{' '}
        <Link href="/policies/terms">Terms</Link>
      </p>
    </footer>
  );
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
