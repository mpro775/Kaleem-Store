import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { StorefrontCategory, StorefrontProduct } from '../lib/types';
import { TrackedLink } from './tracked-link';

function bilingual(ar: string | null | undefined, en: string | null | undefined, fallback: string): string {
  if (ar && en) return `${ar} / ${en}`;
  return ar ?? en ?? fallback;
}

interface ThemeSectionsProps {
  storeName: string;
  sections: unknown[];
  categories: StorefrontCategory[];
  featuredProducts: StorefrontProduct[];
}

type RegisteredSectionType =
  | 'announcement_bar'
  | 'header'
  | 'hero'
  | 'categories_grid'
  | 'featured_products'
  | 'rich_text'
  | 'testimonials'
  | 'newsletter_signup'
  | 'offers_banner'
  | 'faq'
  | 'trust_badges'
  | 'footer';

interface ThemeBlock {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

interface ThemeSection {
  id: string;
  type: RegisteredSectionType;
  enabled: boolean;
  variant: string;
  settings: Record<string, unknown>;
  blocks: ThemeBlock[];
}

interface UnknownSection {
  id: string;
  type: string;
  enabled: boolean;
  variant: string;
  settings: Record<string, unknown>;
  blocks: ThemeBlock[];
  unknownType: true;
}

interface SectionRegistryEntry {
  type: RegisteredSectionType;
  label: string;
  supportsBlocks: boolean;
  variants: readonly string[];
  defaultVariant: string;
  render: (
    section: ThemeSection,
    context: {
      storeName: string;
      categories: StorefrontCategory[];
      featuredProducts: StorefrontProduct[];
    },
  ) => ReactNode;
}

export function ThemeSections({
  storeName,
  sections,
  categories,
  featuredProducts,
}: ThemeSectionsProps) {
  const normalizedSections = normalizeSections(sections).filter((section) => section.enabled);

  if (normalizedSections.length === 0) {
    return (
      <section className="section">
        <div className="section-fallback">No sections are enabled for this storefront theme.</div>
      </section>
    );
  }

  return (
    <>
      {normalizedSections.map((section) => (
        <section
          key={section.id}
          className={`section section-${toClassNameToken(section.type)} section-variant-${toClassNameToken(section.variant)}`}
          data-section-id={section.id}
          data-section-type={section.type}
          data-section-variant={section.variant}
        >
          {renderSection(section, { storeName, categories, featuredProducts })}
        </section>
      ))}
    </>
  );
}

function renderSection(
  section: ThemeSection | UnknownSection,
  context: {
    storeName: string;
    categories: StorefrontCategory[];
    featuredProducts: StorefrontProduct[];
  },
) {
  if ('unknownType' in section && section.unknownType) {
    return <SectionFallback type={section.type} />;
  }

  const knownSection = section as ThemeSection;
  const renderer = sectionRenderers[knownSection.type];
  if (!renderer) {
    return <SectionFallback type={knownSection.type} />;
  }

  return renderer(knownSection, context);
}

const sectionRegistry: Record<RegisteredSectionType, SectionRegistryEntry> = {
  announcement_bar: {
    type: 'announcement_bar',
    label: 'Announcement Bar',
    supportsBlocks: false,
    variants: ['default', 'minimal'],
    defaultVariant: 'default',
    render: (section) => <AnnouncementBarSection settings={section.settings} variant={section.variant} />,
  },
  header: {
    type: 'header',
    label: 'Header',
    supportsBlocks: false,
    variants: ['default', 'centered'],
    defaultVariant: 'default',
    render: (_section, context) => <HeaderSection storeName={context.storeName} />,
  },
  hero: {
    type: 'hero',
    label: 'Hero',
    supportsBlocks: true,
    variants: ['spotlight', 'split', 'compact'],
    defaultVariant: 'spotlight',
    render: (section, context) => (
      <HeroSection storeName={context.storeName} settings={section.settings} variant={section.variant} />
    ),
  },
  categories_grid: {
    type: 'categories_grid',
    label: 'Categories Grid',
    supportsBlocks: false,
    variants: ['grid', 'tiles'],
    defaultVariant: 'grid',
    render: (section, context) => <CategoriesSection categories={context.categories} variant={section.variant} />,
  },
  featured_products: {
    type: 'featured_products',
    label: 'Featured Products',
    supportsBlocks: false,
    variants: ['cards', 'minimal'],
    defaultVariant: 'cards',
    render: (section, context) => (
      <FeaturedProductsSection products={context.featuredProducts} settings={section.settings} variant={section.variant} />
    ),
  },
  rich_text: {
    type: 'rich_text',
    label: 'Rich Text',
    supportsBlocks: false,
    variants: ['default', 'highlight'],
    defaultVariant: 'default',
    render: (section) => <RichTextSection settings={section.settings} variant={section.variant} />,
  },
  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    supportsBlocks: true,
    variants: ['cards', 'quotes'],
    defaultVariant: 'cards',
    render: (section) => <TestimonialsSection settings={section.settings} blocks={section.blocks} variant={section.variant} />,
  },
  newsletter_signup: {
    type: 'newsletter_signup',
    label: 'Newsletter Signup',
    supportsBlocks: false,
    variants: ['default', 'compact'],
    defaultVariant: 'default',
    render: (section) => <NewsletterSignupSection settings={section.settings} variant={section.variant} />,
  },
  offers_banner: {
    type: 'offers_banner',
    label: 'Offers Banner',
    supportsBlocks: false,
    variants: ['default', 'subtle'],
    defaultVariant: 'default',
    render: (section) => <OffersBannerSection variant={section.variant} />,
  },
  faq: {
    type: 'faq',
    label: 'FAQ',
    supportsBlocks: true,
    variants: ['list', 'cards'],
    defaultVariant: 'list',
    render: (section) => <FaqSection settings={section.settings} blocks={section.blocks} variant={section.variant} />,
  },
  trust_badges: {
    type: 'trust_badges',
    label: 'Trust Badges',
    supportsBlocks: true,
    variants: ['inline', 'grid'],
    defaultVariant: 'inline',
    render: (section) => <TrustBadgesSection settings={section.settings} blocks={section.blocks} variant={section.variant} />,
  },
  footer: {
    type: 'footer',
    label: 'Footer',
    supportsBlocks: false,
    variants: ['default', 'minimal'],
    defaultVariant: 'default',
    render: (_section, context) => <FooterSection storeName={context.storeName} />,
  },
};

const sectionRenderers: Record<RegisteredSectionType, SectionRegistryEntry['render']> = {
  announcement_bar: sectionRegistry.announcement_bar.render,
  header: sectionRegistry.header.render,
  hero: sectionRegistry.hero.render,
  categories_grid: sectionRegistry.categories_grid.render,
  featured_products: (_section, context) => (
    sectionRegistry.featured_products.render(_section, context)
  ),
  rich_text: sectionRegistry.rich_text.render,
  testimonials: sectionRegistry.testimonials.render,
  newsletter_signup: sectionRegistry.newsletter_signup.render,
  offers_banner: sectionRegistry.offers_banner.render,
  faq: sectionRegistry.faq.render,
  trust_badges: sectionRegistry.trust_badges.render,
  footer: sectionRegistry.footer.render,
};

function AnnouncementBarSection({
  settings,
  variant,
}: {
  settings: Record<string, unknown>;
  variant: string;
}) {
  const message =
    typeof settings.message === 'string' && settings.message.trim().length > 0
      ? settings.message
      : 'Welcome to our store';
  return <div className={`offers-banner announcement-${toClassNameToken(variant)}`}>{message}</div>;
}

function HeaderSection({ storeName }: { storeName: string }) {
  return (
    <header className="header-panel">
      <p className="overline">Kaleem Store</p>
      <h2>{storeName}</h2>
      <nav className="header-links">
        <TrackedLink href="/categories" eventLabel="header-categories">Categories</TrackedLink>
        <TrackedLink href="/cart" eventLabel="header-cart">Cart</TrackedLink>
        <TrackedLink href="/track-order" eventLabel="header-track-order">Track order</TrackedLink>
        <Link href="/policies/privacy">Policies</Link>
      </nav>
    </header>
  );
}

function HeroSection({
  storeName,
  settings,
  variant,
}: {
  storeName: string;
  settings: Record<string, unknown>;
  variant: string;
}) {
  const headline =
    typeof settings.headline === 'string' ? settings.headline : `Discover ${storeName}`;
  const subheadline =
    typeof settings.subheadline === 'string' && settings.subheadline.trim().length > 0
      ? settings.subheadline
      : 'Order online with a fast checkout flow designed for mobile shoppers.';
  const primaryCtaLabel =
    typeof settings.primaryCtaLabel === 'string' && settings.primaryCtaLabel.trim().length > 0
      ? settings.primaryCtaLabel
      : 'Browse products';
  const primaryCtaHref =
    typeof settings.primaryCtaHref === 'string' && settings.primaryCtaHref.trim().length > 0
      ? settings.primaryCtaHref
      : '/categories';

  return (
    <div className={`hero-panel hero-panel-${toClassNameToken(variant)}`}>
      <p className="overline">Fresh arrivals</p>
      <h1>{headline}</h1>
      <p>{subheadline}</p>
      <div className="hero-actions">
        <TrackedLink href={primaryCtaHref} className="button-primary" eventLabel="hero-primary-cta">
          {primaryCtaLabel}
        </TrackedLink>
        <TrackedLink href="/track-order" className="button-secondary" eventLabel="hero-track-order-cta">
          Track your order
        </TrackedLink>
      </div>
    </div>
  );
}

function CategoriesSection({ categories, variant }: { categories: StorefrontCategory[]; variant: string }) {
  return (
    <div className={`section-categories-${toClassNameToken(variant)}`}>
      <h3>Shop by category</h3>
      <div className="category-grid">
        {categories.slice(0, 8).map((category) => (
          <TrackedLink
            key={category.id}
            href={`/categories?category=${encodeURIComponent(category.slug)}`}
            className="category-card"
            eventLabel="categories-grid-item"
          >
            {category.imageUrl ? (
              <div className="category-image-shell">
                <Image
                  src={category.imageUrl}
                  alt={category.imageAltAr ?? category.imageAltEn ?? bilingual(category.nameAr, category.nameEn, category.name)}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              </div>
            ) : null}
            <strong>{bilingual(category.nameAr, category.nameEn, category.name)}</strong>
            <span>{bilingual(category.descriptionAr, category.descriptionEn, category.description ?? 'Explore the latest products')}</span>
          </TrackedLink>
        ))}
      </div>
    </div>
  );
}

function FeaturedProductsSection({
  products,
  settings,
  variant,
}: {
  products: StorefrontProduct[];
  settings: Record<string, unknown>;
  variant: string;
}) {
  const limit =
    typeof settings.limit === 'number' && Number.isFinite(settings.limit)
      ? Math.max(1, Math.min(24, Math.floor(settings.limit)))
      : 8;

  return (
    <div className={`featured-products featured-products-${toClassNameToken(variant)}`}>
      <h3>Featured products</h3>
      <div className="product-grid">
        {products.slice(0, limit).map((product) => (
          <TrackedLink
            key={product.id}
            href={`/products/${encodeURIComponent(product.slug)}`}
            className="product-card"
            eventLabel="featured-product-item"
          >
            <div className="product-image-shell">
              {product.primaryImageUrl ? (
                <Image
                  src={product.primaryImageUrl}
                  alt={bilingual(product.titleAr, product.titleEn, product.title)}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              ) : (
                <div className="image-fallback">No image</div>
              )}
              {product.isFeatured ? <span className="badge-featured">مميز</span> : null}
            </div>
            <strong>{bilingual(product.titleAr, product.titleEn, product.title)}</strong>
            <span>
              {product.priceFrom ? `From ${product.priceFrom.toFixed(2)}` : 'Price on request'}
            </span>
          </TrackedLink>
        ))}
      </div>
    </div>
  );
}

function RichTextSection({
  settings,
  variant,
}: {
  settings: Record<string, unknown>;
  variant: string;
}) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'About our store';
  const body =
    typeof settings.body === 'string' && settings.body.trim().length > 0
      ? settings.body
      : 'Curated products with reliable delivery and transparent support.';
  return (
    <div className={`hero-panel rich-text-${toClassNameToken(variant)}`}>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function TestimonialsSection({
  settings,
  blocks,
  variant,
}: {
  settings: Record<string, unknown>;
  blocks: ThemeBlock[];
  variant: string;
}) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'Customer stories';

  const items = resolveTestimonialItems(settings, blocks);

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3>{title}</h3>
      <div className={`category-grid testimonials-${toClassNameToken(variant)}`}>
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

function NewsletterSignupSection({
  settings,
  variant,
}: {
  settings: Record<string, unknown>;
  variant: string;
}) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'Get updates';
  const ctaLabel =
    typeof settings.ctaLabel === 'string' && settings.ctaLabel.trim().length > 0
      ? settings.ctaLabel
      : 'Join';
  return (
    <div className={`hero-panel newsletter-${toClassNameToken(variant)}`}>
      <h3>{title}</h3>
      <p>Subscribe for new arrivals and limited offers.</p>
      <div className="hero-actions">
        <button className="button-primary" type="button">
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function OffersBannerSection({ variant }: { variant: string }) {
  return (
    <div className={`offers-banner offers-${toClassNameToken(variant)}`}>
      <p className="overline">Offers</p>
      <h3>Cash on delivery and bank transfer</h3>
      <p>Checkout supports local payment flows with clear order tracking.</p>
    </div>
  );
}

function FaqSection({
  settings,
  blocks,
  variant,
}: {
  settings: Record<string, unknown>;
  blocks: ThemeBlock[];
  variant: string;
}) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'Frequently asked questions';

  const items = resolveFaqItems(settings, blocks);
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`faq-panel faq-${toClassNameToken(variant)}`}>
      <h3>{title}</h3>
      <div className="faq-list">
        {items.map((item, index) => {
          const question =
            typeof item.question === 'string' && item.question.trim().length > 0
              ? item.question
              : `Question ${index + 1}`;
          const answer =
            typeof item.answer === 'string' && item.answer.trim().length > 0
              ? item.answer
              : 'Answer will be available soon.';

          return (
            <article key={`${question}-${index}`} className="faq-item">
              <h4>{question}</h4>
              <p>{answer}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TrustBadgesSection({
  settings,
  blocks,
  variant,
}: {
  settings: Record<string, unknown>;
  blocks: ThemeBlock[];
  variant: string;
}) {
  const title =
    typeof settings.title === 'string' && settings.title.trim().length > 0
      ? settings.title
      : 'Why shop with us';

  const badges = resolveTrustBadges(settings, blocks);
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`trust-panel trust-${toClassNameToken(variant)}`}>
      <h3>{title}</h3>
      <div className="trust-badges-grid">
        {badges.map((badge, index) => {
          const label =
            typeof badge.label === 'string' && badge.label.trim().length > 0
              ? badge.label
              : `Badge ${index + 1}`;
          const description =
            typeof badge.description === 'string' && badge.description.trim().length > 0
              ? badge.description
              : null;

          return (
            <article key={`${label}-${index}`} className="trust-badge-item">
              <strong>{label}</strong>
              {description ? <p>{description}</p> : null}
            </article>
          );
        })}
      </div>
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

function normalizeSections(values: unknown[]): Array<ThemeSection | UnknownSection> {
  const seenIds = new Set<string>();
  const output: Array<ThemeSection | UnknownSection> = [];

  for (let index = 0; index < values.length; index += 1) {
    const normalized = normalizeSection(values[index], index);
    if (!normalized) {
      continue;
    }

    if (seenIds.has(normalized.id)) {
      continue;
    }

    seenIds.add(normalized.id);
    output.push(normalized);
  }

  return output;
}

function normalizeSection(value: unknown, index: number): ThemeSection | UnknownSection | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    typeof value.id === 'string' && value.id.trim().length > 0 ? value.id.trim() : `section-${index + 1}`;
  const enabled = value.enabled !== false;
  const settings = isRecord(value.settings) ? value.settings : {};
  const blocks = normalizeBlocks(value.blocks, `${id}-block`);

  if (typeof value.type !== 'string') {
    return null;
  }

  const entry = sectionRegistry[value.type as RegisteredSectionType];
  if (!entry) {
    return {
      id,
      type: value.type,
      enabled,
      variant: 'default',
      settings,
      blocks,
      unknownType: true,
    };
  }

  const variant = resolveVariant(value.variant, entry);

  return {
    id,
    type: entry.type,
    enabled,
    variant,
    settings,
    blocks: entry.supportsBlocks ? blocks : [],
  };
}

function normalizeBlocks(value: unknown, idPrefix: string): ThemeBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      return {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id.trim()
            : `${idPrefix}-${index + 1}`,
        type: typeof item.type === 'string' && item.type.trim().length > 0 ? item.type.trim() : 'item',
        settings: isRecord(item.settings) ? item.settings : {},
      };
    })
    .filter((item): item is ThemeBlock => item !== null)
    .slice(0, 24);
}

function resolveVariant(value: unknown, entry: SectionRegistryEntry): string {
  if (typeof value === 'string' && entry.variants.includes(value)) {
    return value;
  }

  return entry.defaultVariant;
}

function resolveTestimonialItems(settings: Record<string, unknown>, blocks: ThemeBlock[]): Record<string, unknown>[] {
  const fromBlocks = blocks
    .filter((block) => block.type === 'testimonial_item')
    .map((block) => block.settings)
    .slice(0, 6);

  if (fromBlocks.length > 0) {
    return fromBlocks;
  }

  return Array.isArray(settings.items)
    ? settings.items
        .map((item) => (isRecord(item) ? item : null))
        .filter((item): item is Record<string, unknown> => item !== null)
        .slice(0, 6)
    : [];
}

function resolveFaqItems(settings: Record<string, unknown>, blocks: ThemeBlock[]): Record<string, unknown>[] {
  const fromBlocks = blocks
    .filter((block) => block.type === 'faq_item')
    .map((block) => block.settings)
    .slice(0, 8);

  if (fromBlocks.length > 0) {
    return fromBlocks;
  }

  return Array.isArray(settings.items)
    ? settings.items
        .map((item) => (isRecord(item) ? item : null))
        .filter((item): item is Record<string, unknown> => item !== null)
        .slice(0, 8)
    : [];
}

function resolveTrustBadges(settings: Record<string, unknown>, blocks: ThemeBlock[]): Record<string, unknown>[] {
  const fromBlocks = blocks
    .filter((block) => block.type === 'trust_badge')
    .map((block) => block.settings)
    .slice(0, 6);

  if (fromBlocks.length > 0) {
    return fromBlocks;
  }

  return Array.isArray(settings.items)
    ? settings.items
        .map((item) => (isRecord(item) ? item : null))
        .filter((item): item is Record<string, unknown> => item !== null)
        .slice(0, 6)
    : [];
}

function toClassNameToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
