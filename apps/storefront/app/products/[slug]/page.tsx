import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ProductPurchaseCard } from '../../../components/product-purchase-card';
import { getProduct } from '../../../lib/storefront-server';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
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
                alt={product.title}
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
                  <Image src={image.url} alt={image.altText ?? product.title} fill sizes="96px" />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="stack-lg">
          <article className="panel stack-md">
            <h1>{product.title}</h1>
            <p>{product.description ?? 'No description available for this product yet.'}</p>
            <p className="muted">
              Starting price: {product.priceFrom ? product.priceFrom.toFixed(2) : 'N/A'}
            </p>
          </article>

          <ProductPurchaseCard variants={product.variants} />
        </section>
      </div>
    </main>
  );
}
