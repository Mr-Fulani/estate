import { getLocaleConfig, defaultAvailableLocale } from '@/lib/runtime-locales';
import { getSiteOrigin } from '@/lib/site-config';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import { PropertyDetailContent } from '@/components/pages/PropertyDetailContent';
import { isLocale, openGraphLocales } from '@/i18n/config';
import { hasPropertyLocale, localizedProperty, localizedPropertyTranslation, propertyAvailableLocales } from '@/i18n/domain';
import { brandName } from '@/lib/site-profile';
import { fetchProperty, fetchSiteSettings } from '@/lib/api';


type PropertyPageProps = { params: Promise<{ locale: string; id: string }> };


function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const siteUrl = getSiteOrigin();
  return new URL(value, siteUrl).toString();
}


export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const sourceProperty = await fetchProperty(id);
  if (!sourceProperty) notFound();
  if (id !== sourceProperty.slug) permanentRedirect(`/${locale}/properties/${sourceProperty.slug}`);
  const settings = await fetchSiteSettings();

  const availableLocales = propertyAvailableLocales(sourceProperty).filter(value => getLocaleConfig().locales.includes(value));
  if (!availableLocales.length) notFound();
  const hasRequestedLocale = hasPropertyLocale(sourceProperty, locale);
  const canonicalLocale = hasRequestedLocale ? locale : defaultAvailableLocale(availableLocales);
  const property = localizedProperty(sourceProperty, canonicalLocale);
  const translation = localizedPropertyTranslation(sourceProperty, canonicalLocale);
  const location = [property.district, property.city].filter(Boolean).join(', ');
  const generatedTitle = `${property.title}${location ? ` — ${location}` : ''} | ${brandName(settings)}`;
  const generatedDescription = property.description?.replace(/\s+/g, ' ').trim().slice(0, 160)
    || `${property.title}. ${property.area ? `${property.area} ${canonicalLocale === 'en' ? 'sq m' : 'm²'}. ` : ''}${location}.`;
  const title = translation?.meta_title?.trim() || generatedTitle;
  const description = translation?.meta_description?.trim() || generatedDescription;
  const canonicalPath = `/${canonicalLocale}/properties/${sourceProperty.slug}`;
  const images = sourceProperty.images?.[0]
    ? [{ url: absoluteUrl(sourceProperty.images[0]), alt: property.title }]
    : [];
  const indexable = !sourceProperty.development?.is_demo && sourceProperty.is_active && sourceProperty.market_status !== 'archived' && hasRequestedLocale;
  const languages = Object.fromEntries([
    ...availableLocales.map((availableLocale) => [
      availableLocale,
      `/${availableLocale}/properties/${sourceProperty.slug}`,
    ]),
    ['x-default', `/${defaultAvailableLocale(availableLocales)}/properties/${sourceProperty.slug}`],
  ]);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages,
    },
    robots: { index: indexable, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName: brandName(settings),
      locale: openGraphLocales[canonicalLocale],
      type: 'website',
      images,
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}


export default async function LocalizedPropertyDetailPage({
  params,
}: PropertyPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const property = await fetchProperty(id);
  if (!property) notFound();
  if (id !== property.slug) permanentRedirect(`/${locale}/properties/${property.slug}`);
  return <PropertyDetailContent id={id} locale={locale} initialProperty={property} />;
}
