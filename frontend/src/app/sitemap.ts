import type { MetadataRoute } from 'next';

import { locales, type Locale } from '@/i18n/config';
import { propertyAvailableLocales } from '@/i18n/domain';
import { fetchNews, fetchProperties } from '@/lib/api';


export const dynamic = 'force-dynamic';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const absolute = (path: string) => `${siteUrl}${path}`;
  const languageAlternates = (path: string, availableLocales: readonly Locale[]) => Object.fromEntries([
    ...availableLocales.map((locale) => [locale, absolute(`/${locale}${path}`)]),
    ['x-default', absolute(`/ru${path}`)],
  ]);
  const staticPaths = ['', '/properties', '/services', '/news', '/reviews', '/about', '/contact', '/privacy', '/terms'];
  const entries: MetadataRoute.Sitemap = locales.flatMap((locale) => staticPaths.map((path) => ({
    url: absolute(`/${locale}${path}`),
    changeFrequency: path === '/news' || path === '/properties' ? 'daily' as const : 'weekly' as const,
    priority: path === '' ? 1 : path === '/properties' ? 0.9 : 0.7,
    alternates: { languages: languageAlternates(path, locales) },
  })));

  try {
    const firstPage = await fetchProperties({ per_page: 100, page: 1, sort_by: 'updated_at', order: 'desc' });
    const pages = Math.ceil(firstPage.total / firstPage.per_page);
    const properties = [...firstPage.items];
    for (let page = 2; page <= pages; page += 1) {
      properties.push(...(await fetchProperties({ per_page: 100, page })).items);
    }
    entries.push(...properties
      .filter((property) => property.market_status !== 'archived')
      .flatMap((property) => {
        const availableLocales = propertyAvailableLocales(property);
        const path = `/properties/${property.slug}`;
        return availableLocales.map((locale) => ({
          url: absolute(`/${locale}${path}`),
          lastModified: property.updated_at || property.created_at,
          changeFrequency: 'weekly' as const,
          priority: property.is_featured ? 0.9 : 0.8,
          alternates: { languages: languageAlternates(path, availableLocales) },
        }));
      }));
  } catch {
    // Keep the static sitemap available while the API is temporarily unavailable.
  }

  try {
    const firstPage = await fetchNews('ru', 1, 50);
    const pages = Math.ceil(firstPage.total / firstPage.per_page);
    const articles = [...firstPage.items];
    for (let page = 2; page <= pages; page += 1) {
      articles.push(...(await fetchNews('ru', page, 50)).items);
    }
    entries.push(...articles.flatMap((article) => {
      const availableLocales = article.available_locales;
      const path = `/news/${article.slug}`;
      return availableLocales.map((locale) => ({
        url: absolute(`/${locale}${path}`),
        lastModified: article.published_at || undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: { languages: languageAlternates(path, availableLocales) },
      }));
    }));
  } catch {
    // Static and property entries remain available while the news API is unavailable.
  }

  return entries;
}
