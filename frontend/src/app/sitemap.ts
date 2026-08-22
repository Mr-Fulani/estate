import type { MetadataRoute } from 'next';

import { locales } from '@/i18n/config';
import { fetchProperties } from '@/lib/api';


export const dynamic = 'force-dynamic';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const staticPaths = ['', '/properties', '/services', '/news', '/reviews', '/about', '/contact'];
  const entries: MetadataRoute.Sitemap = locales.flatMap((locale) => staticPaths.map((path) => ({
    url: `${siteUrl}/${locale}${path}`,
    changeFrequency: path === '/news' || path === '/properties' ? 'daily' as const : 'weekly' as const,
    priority: path === '' ? 1 : path === '/properties' ? 0.9 : 0.7,
  })));

  try {
    const firstPage = await fetchProperties({ per_page: 100, page: 1, sort_by: 'updated_at', order: 'desc' });
    const pages = Math.ceil(firstPage.total / firstPage.per_page);
    const remaining = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, index) => fetchProperties({ per_page: 100, page: index + 2 }))
    );
    const properties = [firstPage.items, ...remaining.map((page) => page.items)].flat();
    entries.push(...properties.flatMap((property) => locales.map((locale) => ({
      url: `${siteUrl}/${locale}/properties/${property.slug}`,
      lastModified: property.updated_at || property.created_at,
      changeFrequency: 'weekly' as const,
      priority: property.is_featured ? 0.9 : 0.8,
    }))));
  } catch {
    // Keep the static sitemap available while the API is temporarily unavailable.
  }

  return entries;
}
