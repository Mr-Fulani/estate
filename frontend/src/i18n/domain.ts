import type { Property } from '@/types';
import type { Locale } from './config';


const categoryNames: Record<Locale, Record<string, string>> = {
  ru: { kvartira: 'Квартира', dom: 'Дом', uchastok: 'Участок', kommerciya: 'Коммерция', villa: 'Вилла', villy: 'Виллы' },
  en: { kvartira: 'Apartment', dom: 'House', uchastok: 'Land', kommerciya: 'Commercial', villa: 'Villa', villy: 'Villas' },
  tr: { kvartira: 'Daire', dom: 'Ev', uchastok: 'Arsa', kommerciya: 'Ticari', villa: 'Villa', villy: 'Villalar' },
};

const officeAddress: Record<Locale, string> = {
  ru: 'г. Стамбул, Бейликдюзю',
  en: 'Istanbul, Beylikduzu',
  tr: 'İstanbul, Beylikdüzü',
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

  return isBeylikduzuOffice ? officeAddress[locale] : address;
}


export function localizedCategoryName(locale: Locale, slug?: string, fallback = ''): string {
  return (slug && categoryNames[locale][slug]) || fallback;
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
  };
}


export function localizedPropertyTranslation(property: Property, locale: Locale) {
  return property.translations?.find((item) => item.locale === locale)
    || property.translations?.find((item) => item.locale === 'ru');
}


export function roomLabel(locale: Locale, rooms: number | null | undefined): string {
  if (rooms == null) return '—';
  if (locale === 'en') return `${rooms} ${rooms === 1 ? 'room' : 'rooms'}`;
  if (locale === 'tr') return `${rooms} oda`;

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
  } as const;
  return labels[locale][key];
}
