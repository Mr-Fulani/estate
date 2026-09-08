import type { CategoryTranslation, Property, PropertyTranslation, SiteSettings, SiteSettingsTranslation } from '@/types';
import { defaultLocale, type Locale } from './config';


export function localizedOfficeAddress(_locale: Locale, address: string): string { return address; }

function localizedTranslation<T extends { locale: Locale }>(
  translations: T[] | undefined,
  locale: Locale,
): T | undefined {
  return translations?.find((item) => item.locale === locale)
    || translations?.[0];
}


export function localizedCategoryName(
  locale: Locale,
  _slug?: string,
  fallback = '',
  translations?: CategoryTranslation[],
): string {
  return translations?.find((item) => item.locale === locale)?.name
    || localizedTranslation(translations, locale)?.name
    || fallback;
}


export function localizedSiteSettings(settings: SiteSettings, locale: Locale): SiteSettingsTranslation {
  return settings.translations?.find(item => item.locale === locale)
    || { locale, address: settings.address, working_hours: settings.working_hours };
}

/** Navigation groups are plural; individual cards retain their category label. */
export function localizedCategoryNavigationName(
  locale: Locale, slug?: string, fallback = '', translations?: CategoryTranslation[],
): string {
  return localizedCategoryName(locale, slug, fallback, translations);
}


export function localizedProperty(property: Property, locale: Locale): Property {
  const translation = localizedPropertyTranslation(property, locale);
  if (!translation) return property;
  return {
    ...property,
    title: translation.title || property.title,
    description: translation.description || property.description,
    city: translation.city || property.city,
    district: translation.district || property.district,
    address: translation.address || property.address,
    status_badge: translation.status_badge || property.status_badge,
  };
}


function completePropertyTranslations(property: Property): PropertyTranslation[] {
  const translations = (property.translations || []).filter((item) => item.title.trim() && item.description?.trim());
  if (!translations.some((item) => item.locale === (property.content_locale || defaultLocale)) && property.title?.trim() && property.description?.trim()) {
    translations.push({ locale: property.content_locale || defaultLocale, title: property.title, description: property.description, city: property.city, district: property.district, address: property.address });
  }
  return translations;
}

export function localizedPropertyTranslation(property: Property, locale: Locale) {
  const complete = completePropertyTranslations(property);
  return complete.find(item => item.locale === locale) || complete.find(item => item.locale === (property.content_locale || defaultLocale)) || complete[0];
}

export function hasPropertyLocale(property: Property, locale: Locale): boolean {
  return completePropertyTranslations(property).some((item) => item.locale === locale);
}

export function propertyAvailableLocales(property: Property): Locale[] {
  return completePropertyTranslations(property).map((item) => item.locale);
}


export function roomLabel(locale: Locale, rooms: number | null | undefined): string {
  if (rooms == null) return '—';
  if (locale === 'en') return `${rooms} ${rooms === 1 ? 'room' : 'rooms'}`;
  if (locale === 'tr') return `${rooms} oda`;
  if (locale === 'ar') {
    const plural = new Intl.PluralRules('ar').select(rooms);
    const word = plural === 'one' ? 'غرفة'
      : plural === 'two' ? 'غرفتان'
        : plural === 'few' ? 'غرف'
          : 'غرفة';
    return `${rooms} ${word}`;
  }

  const mod100 = Math.abs(rooms) % 100;
  const mod10 = mod100 % 10;
  const word = mod100 > 10 && mod100 < 20
    ? 'комнат'
    : mod10 === 1
      ? 'комната'
      : mod10 > 1 && mod10 < 5
        ? 'комнаты'
        : 'комнат';
  return `${rooms} ${word}`;
}


export function localizedStatus(locale: Locale, value: string): string {
  const normalized = value.toLowerCase();
  const key = normalized.includes('рассроч') ? 'installment'
    : normalized.includes('эксклюзив') ? 'exclusive'
      : normalized.includes('горяч') ? 'hotPrice'
        : normalized.includes('торг') ? 'negotiable'
          : normalized.includes('брон') ? 'reserved'
            : normalized.includes('продан') ? 'sold'
              : normalized.includes('сдан') || normalized.includes('арендован') ? 'rented'
                : normalized.includes('архив') || normalized.includes('снят') ? 'archived'
                  : normalized.includes('спец') ? 'special'
                    : normalized.includes('акту') || normalized.includes('свобод') ? 'available'
                      : null;
  if (!key) return value;
  const labels = {
    ru: {
      available: 'Актуально', reserved: 'В брони', sold: 'Продано', rented: 'Сдано', archived: 'В архиве',
      special: 'Спецпредложение', hotPrice: 'Горячая цена', exclusive: 'Эксклюзив', installment: 'Рассрочка 0%', negotiable: 'Торг уместен',
    },
    en: {
      available: 'Available', reserved: 'Reserved', sold: 'Sold', rented: 'Rented', archived: 'Archived',
      special: 'Special offer', hotPrice: 'Hot price', exclusive: 'Exclusive', installment: '0% instalments', negotiable: 'Price negotiable',
    },
    tr: {
      available: 'Satışta', reserved: 'Rezerve', sold: 'Satıldı', rented: 'Kiralandı', archived: 'Arşivde',
      special: 'Özel fırsat', hotPrice: 'Fırsat fiyatı', exclusive: 'Özel', installment: '%0 taksit', negotiable: 'Pazarlık payı var',
    },
    ar: {
      available: 'متاح', reserved: 'محجوز', sold: 'تم البيع', rented: 'تم التأجير', archived: 'مؤرشف',
      special: 'عرض خاص', hotPrice: 'سعر مميز', exclusive: 'حصري', installment: 'تقسيط 0%', negotiable: 'السعر قابل للتفاوض',
    },
  } as const;
  return labels[locale][key];
}
