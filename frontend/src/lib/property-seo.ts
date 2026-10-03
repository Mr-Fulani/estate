import type { Locale } from '@/i18n/config';
import type { Property, PropertyUnitType } from '@/types';
import { isDirectVideoUrl, videoPosterUrl } from '@/lib/video-media';

const labels = {
  ru: { unit: 'Планировка', area: 'Площадь', details: 'Планы, фотографии и сведения об объекте.', video: 'Видео' },
  en: { unit: 'Layout', area: 'Area', details: 'Floor plans, photos and property details.', video: 'Video' },
  tr: { unit: 'Daire tipi', area: 'Alan', details: 'Kat planları, fotoğraflar ve mülk bilgileri.', video: 'Video' },
  ar: { unit: 'التوزيع', area: 'المساحة', details: 'المخططات والصور وتفاصيل العقار.', video: 'فيديو' },
};

export function unitSeoDescription(property: Pick<Property, 'title' | 'city' | 'district'>, unit: PropertyUnitType, locale: Locale) {
  const copy = labels[locale];
  const parts = [`${copy.unit} ${unit.code.trim()}`, property.title];
  const bounds = [unit.area_min, unit.area_max].filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);
  const format = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 });
  if (bounds.length) {
    const min = Math.min(...bounds), max = Math.max(...bounds);
    parts.push(`${copy.area}: ${format(min)}${min !== max ? `–${format(max)}` : ''} m²`);
  }
  const location = [property.district, property.city].filter(Boolean).join(', ');
  if (location && !property.title.includes(location)) parts.push(location);
  return `${parts.join(' · ')}. ${copy.details}`;
}

/** Describe actual locally optimized video files; never invent upload dates. */
export function propertyVideoSchema(urls: string[], title: string, locale: Locale, pageUrl: string, origin: string) {
  return Array.from(new Set(urls)).filter(url => isDirectVideoUrl(url) && videoPosterUrl(url)).map((url, index) => ({
    '@context': 'https://schema.org', '@type': 'VideoObject',
    '@id': `${pageUrl}#video-${index + 1}`,
    name: `${title} — ${labels[locale].video} ${index + 1}`,
    description: `${labels[locale].video}: ${title}`,
    thumbnailUrl: new URL(videoPosterUrl(url)!, origin).toString(),
    contentUrl: new URL(url, origin).toString(),
    inLanguage: locale,
    isPartOf: { '@id': pageUrl },
  }));
}
