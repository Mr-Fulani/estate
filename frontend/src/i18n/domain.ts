import type { CategoryTranslation, Property, SiteSettings, SiteSettingsTranslation } from '@/types';
import type { Locale } from './config';


const categoryNames: Record<Locale, Record<string, string>> = {
  ru: { kvartira: 'Квартира', dom: 'Дом', uchastok: 'Участок', kommerciya: 'Коммерция', villa: 'Вилла', villy: 'Виллы' },
  en: { kvartira: 'Apartment', dom: 'House', uchastok: 'Land', kommerciya: 'Commercial', villa: 'Villa', villy: 'Villas' },
  tr: { kvartira: 'Daire', dom: 'Ev', uchastok: 'Arsa', kommerciya: 'Ticari', villa: 'Villa', villy: 'Villalar' },
  ar: { kvartira: 'شقة', dom: 'منزل', uchastok: 'أرض', kommerciya: 'عقار تجاري', villa: 'فيلا', villy: 'فلل' },
};

const officeAddresses: Record<'istanbul' | 'moscow', Record<Locale, string>> = {
  istanbul: {
    ru: 'г. Стамбул, Бейликдюзю', en: 'Istanbul, Beylikduzu', tr: 'İstanbul, Beylikdüzü', ar: 'إسطنبول، بيليك دوزو',
  },
  moscow: {
    ru: 'г. Москва, Пресненская набережная, 12, Башня Федерация',
    en: 'Moscow, 12 Presnenskaya Embankment, Federation Tower',
    tr: 'Moskova, Presnenskaya Naberejnaya 12, Federasyon Kulesi',
    ar: 'موسكو، جادة بريسنينسكايا 12، برج فيديراسيا',
  },
};

const defaultWorkingHours: Record<Locale, string> = {
  ru: 'Ежедневно с 9:00 до 21:00',
  en: 'Daily, 9:00–21:00',
  tr: 'Her gün 09:00–21:00',
  ar: 'يومياً من 9:00 إلى 21:00',
};

function normalizeAddress(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ru-RU');
}


export function localizedOfficeAddress(locale: Locale, address: string): string {
  const normalized = normalizeAddress(address);
  const includesAny = (variants: string[]) => variants.some(
    (variant) => normalized.includes(normalizeAddress(variant)),
  );
  const isBeylikduzuOffice = includesAny(['стамбул', 'istanbul'])
    && includesAny(['бейликдюзю', 'beylikdüzü', 'beylikduzu']);

  if (isBeylikduzuOffice) return officeAddresses.istanbul[locale];
  const isMoscowOffice = includesAny(['москва', 'moscow'])
    && includesAny(['преснен', 'presnen', 'federation', 'федерац']);
  return isMoscowOffice ? officeAddresses.moscow[locale] : address;
}


function localizedTranslation<T extends { locale: Locale }>(
  translations: T[] | undefined,
  locale: Locale,
): T | undefined {
  return translations?.find((item) => item.locale === locale)
    || (locale === 'ar' ? translations?.find((item) => item.locale === 'en') : undefined)
    || translations?.find((item) => item.locale === 'ru');
}


export function localizedCategoryName(
  locale: Locale,
  slug?: string,
  fallback = '',
  translations?: CategoryTranslation[],
): string {
  return translations?.find((item) => item.locale === locale)?.name
    || (slug && categoryNames[locale][slug])
    || localizedTranslation(translations, locale)?.name
    || fallback;
}


export function localizedSiteSettings(settings: SiteSettings, locale: Locale): SiteSettingsTranslation {
  const translation = localizedTranslation(settings.translations, locale);
  if (translation) {
    const isRussianFallback = translation.locale === 'ru' && locale !== 'ru';
    return {
      ...translation,
      address: isRussianFallback ? localizedOfficeAddress(locale, translation.address) : translation.address,
      working_hours: isRussianFallback && normalizeAddress(translation.working_hours).includes('ежедневно')
        ? defaultWorkingHours[locale]
        : translation.working_hours,
    };
  }
  return {
    locale: 'ru',
    address: localizedOfficeAddress(locale, settings.address),
    working_hours: locale !== 'ru' && normalizeAddress(settings.working_hours).includes('ежедневно')
      ? defaultWorkingHours[locale]
      : settings.working_hours,
  };
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


export function localizedPropertyTranslation(property: Property, locale: Locale) {
  return localizedTranslation(property.translations, locale);
}


export function hasPropertyLocale(property: Property, locale: Locale): boolean {
  if (locale === 'ru') return true;
  return Boolean(property.translations?.some(
    (item) => item.locale === locale && item.title.trim(),
  ));
}


export function propertyAvailableLocales(property: Property): Locale[] {
  const available = new Set<Locale>(['ru']);
  for (const translation of property.translations || []) {
    if (translation.title.trim()) available.add(translation.locale);
  }
  return Array.from(available);
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
