import { indexingEnabled } from '@/lib/indexing';
import { getSiteOrigin } from '@/lib/site-config';
import type { MetadataRoute } from 'next';


export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (getSiteOrigin()).replace(/\/$/, '');
  return {
    // Crawlable responses let robots read X-Robots-Tag noindex.
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    sitemap: indexingEnabled() ? `${siteUrl}/sitemap.xml` : undefined,
    host: siteUrl,
  };
}
