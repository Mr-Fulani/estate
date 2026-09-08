import { readyForIndexing } from '@/lib/indexing';
import { collectionsLabel } from '@/lib/landing-pages';
import { getLocaleConfig } from '@/lib/runtime-locales';
import type { Metadata } from 'next';
import { openGraphLocales, type Locale } from '@/i18n/config';
import { fetchSiteSettings } from '@/lib/api';
import { brandName, getSiteCopy, type SeoPage } from '@/lib/site-profile';

export function localizedAlternates(path: string) {
  const { locales, defaultLocale } = getLocaleConfig();
  return Object.fromEntries([...locales.map(locale => [locale, `/${locale}${path}`]), ['x-default', `/${defaultLocale}${path}`]]);
}

export async function localizedPageMetadata(
  locale: Locale, path: string, title: string, description: string,
  options: { canonicalSuffix?: string; index?: boolean; image?: string | null } = {},
): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const page = (path.replace(/^\//, '') || 'home') as SeoPage;
  const custom = settings.profile?.seo?.[locale]?.[page];
  title = custom?.title?.trim() || title;
  description = custom?.description?.trim() || description;
  if (options.canonicalSuffix) title += ` — ${new URLSearchParams(options.canonicalSuffix).get('page')}`;
  const canonical = `/${locale}${path}${options.canonicalSuffix || ''}`;
  const image = options.image === undefined ? settings.profile?.og_image_url : options.image;
  return {
    title, description,
    alternates: { canonical, languages: localizedAlternates(`${path}${options.canonicalSuffix || ''}`) },
    robots: { index: readyForIndexing(settings) && options.index !== false, follow: true },
    openGraph: { title, description, url: canonical, siteName: brandName(settings), locale: openGraphLocales[locale], type: 'website', images: image ? [{ url: image, alt: title }] : [] },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : [] },
  };
}

export async function staticPageMetadata(locale: Locale, page: SeoPage): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const copy = getSiteCopy(locale, settings);
  const labels = {
    collections: collectionsLabel[locale],
    home: copy.home.title, properties: copy.catalog.title, services: copy.services.title,
    about: copy.about.title, contact: copy.contact.title, news: copy.news.title, reviews: copy.reviews.title,
    privacy: copy.footer.privacy, terms: copy.footer.terms,
  };
  const descriptions = {
    collections: copy.catalog.description,
    home: copy.home.description, properties: copy.catalog.description, services: copy.services.description,
    about: copy.about.intro, contact: copy.contact.description, news: copy.news.description,
    reviews: copy.reviews.description, privacy: '', terms: '',
  };
  const label = labels[page];
  const title = label.includes(brandName(settings)) ? label : `${label} — ${brandName(settings)}`;
  return localizedPageMetadata(locale, page === 'home' ? '' : `/${page}`, title, descriptions[page]);
}
