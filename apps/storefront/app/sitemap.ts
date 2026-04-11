import type { MetadataRoute } from 'next';
import { listCategories, listProducts } from '../lib/storefront-server';
import { getSiteOrigin } from '../lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getSiteOrigin();
  const now = new Date();

  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({ page: 1, limit: 200 }),
  ]);

  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: `${origin}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${origin}/categories`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${origin}/track-order`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
    },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${origin}/categories?category=${encodeURIComponent(category.slug)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.items.map((product) => ({
    url: `${origin}/products/${encodeURIComponent(product.slug)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...baseEntries, ...categoryEntries, ...productEntries];
}
