import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PropertyDetailContent } from '@/components/pages/PropertyDetailContent';
import { isLocale } from '@/i18n/config';
import { hasPropertyLocale, localizedProperty, localizedPropertyTranslation, propertyAvailableLocales } from '@/i18n/domain';
import { fetchProperty } from '@/lib/api';


type PropertyPageProps = { params: Promise<{ locale: string; id: string }> };


function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return new URL(value, siteUrl).toString();
}


export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const sourceProperty = await fetchProperty(id);
  if (!sourceProperty) return { title: 'Estate', robots: { index: false, follow: false } };

  const property = localizedProperty(sourceProperty, locale);
  const translation = localizedPropertyTranslation(sourceProperty, locale);
  const hasRequestedLocale = hasPropertyLocale(sourceProperty, locale);
  const availableLocales = propertyAvailableLocales(sourceProperty);
  const canonicalLocale = hasRequestedLocale ? locale : 'ru';
  const location = [property.district, property.city].filter(Boolean).join(', ');
  const generatedTitle = `${property.title}${location ? ` — ${location}` : ''} | Estate`;
  const generatedDescription = property.description?.replace(/\s+/g, ' ').trim().slice(0, 160)
    || `${property.title}. ${property.area ? `${property.area} ${canonicalLocale === 'en' ? 'sq m' : 'm²'}. ` : ''}${location}.`;
  const title = translation?.meta_title?.trim() || generatedTitle;
  const description = translation?.meta_description?.trim() || generatedDescription;
  const canonicalPath = `/${canonicalLocale}/properties/${sourceProperty.slug}`;
  const images = sourceProperty.images?.[0]
    ? [{ url: absoluteUrl(sourceProperty.images[0]), alt: property.title }]
    : [];
  const indexable = sourceProperty.is_active && sourceProperty.market_status !== 'archived' && hasRequestedLocale;
  const languages = Object.fromEntries([
    ...availableLocales.map((availableLocale) => [
      availableLocale,
      `/${availableLocale}/properties/${sourceProperty.slug}`,
    ]),
    ['x-default', `/ru/properties/${sourceProperty.slug}`],
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
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Estate',
      locale: canonicalLocale === 'ru' ? 'ru_RU' : canonicalLocale === 'tr' ? 'tr_TR' : 'en_US',
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
  return <PropertyDetailContent id={id} locale={locale} initialProperty={property} />;
}
