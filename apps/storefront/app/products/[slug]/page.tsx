import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductPurchaseCard } from '../../../components/product-purchase-card';
import { WishlistButton } from '../../../components/wishlist-button';
import { ProductReviewsSection } from '../../../components/product-reviews-section';
import { getProduct } from '../../../lib/storefront-server';

export const dynamic = 'force-dynamic';

function bilingual(ar: string | null | undefined, en: string | null | undefined, fallback: string): string {
  if (ar && en) return `${ar} / ${en}`;
  return ar ?? en ?? fallback;
}

function renderStars(rating: number): string {
  const rounded = Math.round(rating);
  return '★'.repeat(Math.min(rounded, 5)) + '☆'.repeat(Math.max(5 - rounded, 0));
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: product.seoTitle ?? bilingual(product.titleAr, product.titleEn, product.title),
      description:
        product.seoDescription ??
        bilingual(product.descriptionAr, product.descriptionEn, product.description ?? ''),
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  return (
    <main className="page-shell stack-lg">
      <div className="product-layout">
        <section className="panel stack-md">
          <div className="product-hero-image">
            {product.images[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={bilingual(product.titleAr, product.titleEn, product.title)}
                fill
                sizes="(max-width: 768px) 100vw, 620px"
                priority
              />
            ) : (
              <div className="image-fallback">No image</div>
            )}
          </div>

          {product.images.length > 1 ? (
            <div className="gallery-strip">
              {product.images.slice(0, 5).map((image) => (
                <div key={image.id} className="thumb-shell">
                  <Image src={image.url} alt={image.altText ?? bilingual(product.titleAr, product.titleEn, product.title)} fill sizes="96px" />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="stack-lg">
          <article className="panel stack-md">
            <div className="product-title-row">
              <h1>{bilingual(product.titleAr, product.titleEn, product.title)}</h1>
              <WishlistButton productId={product.id} />
            </div>
            <p>{bilingual(product.descriptionAr, product.descriptionEn, product.description ?? 'No description available for this product yet.')}</p>
            <p className="muted">
              Starting price: {product.priceFrom ? product.priceFrom.toFixed(2) : 'N/A'}
            </p>

            {product.ratingCount > 0 ? (
              <div className="product-rating">
                <span className="stars" aria-label={`Rating: ${product.ratingAvg} out of 5`}>
                  {renderStars(product.ratingAvg)}
                </span>
                <span className="muted">({product.ratingCount})</span>
              </div>
            ) : null}

            <div className="product-details">
              {product.brand ? (
                <p><strong>Brand:</strong> {product.brand}</p>
              ) : null}
              {product.weight != null ? (
                <p><strong>Weight:</strong> {product.weight}g</p>
              ) : null}
              {product.dimensions ? (
                <p>
                  <strong>Dimensions:</strong>{' '}
                  {product.dimensions.length ?? '–'} × {product.dimensions.width ?? '–'} × {product.dimensions.height ?? '–'} cm
                </p>
              ) : null}
            </div>

            {product.tags.length > 0 ? (
              <div className="tag-chips">
                {product.tags.map((tag) => (
                  <span key={tag} className="tag-chip">{tag}</span>
                ))}
              </div>
            ) : null}
          </article>

          <ProductPurchaseCard variants={product.variants} />
        </section>
      </div>

      <ProductReviewsSection productId={product.id} />
    </main>
  );
}
