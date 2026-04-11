import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '../lib/seo';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getSiteOrigin();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/cart', '/account', '/customers'],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
