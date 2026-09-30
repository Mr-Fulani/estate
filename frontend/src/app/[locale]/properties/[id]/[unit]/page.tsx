import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DevelopmentUnitDetailPage } from '@/components/properties/DevelopmentUnitDetailPage';
import { defaultAvailableLocale, getLocaleConfig } from '@/lib/runtime-locales';
import { getSiteOrigin } from '@/lib/site-config';
import { readyForIndexing } from '@/lib/indexing';
import { brandName } from '@/lib/site-profile';
import { isLocale, openGraphLocales } from '@/i18n/config';
import { hasPropertyLocale, localizedProperty, propertyAvailableLocales } from '@/i18n/domain';
import { fetchProperty, fetchSiteSettings } from '@/lib/api';
import { developmentUnitMatchesPath } from '@/lib/development-view';

type Props = { params: Promise<{ locale: string; id: string; unit: string }> };

async function resolveUnit(params: Props['params']) {
  const { locale, id, unit: unitPath } = await params;
  if (!isLocale(locale)) notFound();
  const property = await fetchProperty(id);
  if (!property || property.listing_kind !== 'development' || !property.development || property.development.is_demo || !property.is_active) notFound();
  const unit = property.unit_types?.find(item => developmentUnitMatchesPath(item.code, unitPath));
  if (!unit) notFound();
  return { locale, property, unit };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, property: source, unit } = await resolveUnit(params);
  const settings = await fetchSiteSettings();
  const available = propertyAvailableLocales(source).filter(value => getLocaleConfig().locales.includes(value));
  if (!available.length) notFound();
  const hasLocale = hasPropertyLocale(source, locale);
  const canonicalLocale = hasLocale ? locale : defaultAvailableLocale(available);
  const property = localizedProperty(source, canonicalLocale);
  const unitPath = encodeURIComponent(unit.code.trim().toLowerCase().replace(/\s+/g, '-'));
  const canonicalPath = `/${canonicalLocale}/properties/${source.slug}/${unitPath}`;
  const title = `${property.title} · ${unit.code} | ${brandName(settings)}`;
  const area = unit.area_min !== null && unit.area_max !== null ? `${unit.area_min}–${unit.area_max} m²` : '';
  const description = `${property.description?.replace(/\s+/g, ' ').trim() || property.title} ${unit.code}${area ? ` · ${area}` : ''}`.slice(0, 320);
  const languages = Object.fromEntries([
    ...available.map(availableLocale => [availableLocale, `/${availableLocale}/properties/${source.slug}/${unitPath}`]),
    ['x-default', `/${defaultAvailableLocale(available)}/properties/${source.slug}/${unitPath}`],
  ]);
  const images = (unit.media_images || []).map(image => /^https?:\/\//i.test(image) ? image : new URL(image, getSiteOrigin()).toString());
  return {
    title, description,
    alternates: { canonical: canonicalPath, languages },
    robots: { index: readyForIndexing(settings) && source.is_active && source.market_status !== 'archived' && hasLocale, follow: true },
    openGraph: { title, description, url: new URL(canonicalPath, getSiteOrigin()).toString(), siteName: brandName(settings), locale: openGraphLocales[canonicalLocale], type: 'website', images },
    twitter: { card: images.length ? 'summary_large_image' : 'summary', title, description, images },
  };
}

export default async function DevelopmentUnitRoute({ params }: Props) {
  const { locale, property, unit } = await resolveUnit(params);
  return <DevelopmentUnitDetailPage property={property} unit={unit} locale={locale} />;
}
