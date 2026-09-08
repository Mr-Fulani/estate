import { getSiteOrigin } from '@/lib/site-config';
import type { MetadataRoute } from 'next';


export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (getSiteOrigin()).replace(/\/$/, '');
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
