import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { localeTags, type Locale } from '@/i18n/config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined, currency: string = '₽', locale: string = 'ru'): string {
  const localeTag = localeTags[locale as Locale] || localeTags.ru;
  if (price == null) {
    return ({ ru: 'По запросу', en: 'On request', tr: 'Fiyat için iletişime geçin', ar: 'السعر عند الطلب' } as Record<Locale, string>)[locale as Locale] || 'По запросу';
  }
  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: currency === '₽' || currency === 'RUB' ? 'RUB' : currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace('RUB', '₽');
}

export function formatArea(area: number | null | undefined): string {
  if (area == null) return '-';
  return `${area} м²`;
}

export function formatDate(value: string | null, locale: Locale): string {
  if (!value) return '';
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function pluralize(n: number | null | undefined, forms: [string, string, string]): string {
  if (n == null) return '-';
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) {
    return `${n} ${forms[2]}`;
  }
  if (n1 > 1 && n1 < 5) {
    return `${n} ${forms[1]}`;
  }
  if (n1 === 1) {
    return `${n} ${forms[0]}`;
  }
  return `${n} ${forms[2]}`;
}

export function getStatusBadgeVariant(badgeText?: string | null): 'success' | 'warning' | 'danger' | 'purple' | 'secondary' | 'primary' | 'outline' {
  if (!badgeText) return 'outline';
  const lower = badgeText.toLowerCase();
  if (['акт', 'свобод', 'available', 'satışta', 'متاح'].some((value) => lower.includes(value))) return 'success';
  if (['брон', 'ожидан', 'reserved', 'rezerve', 'محجوز'].some((value) => lower.includes(value))) return 'warning';
  if (['продан', 'архив', 'снят', 'sold', 'rented', 'archived', 'satıldı', 'kiralandı', 'arşiv', 'تم البيع', 'تم التأجير', 'مؤرشف'].some((value) => lower.includes(value))) return 'danger';
  if (['спец', 'горяч', 'скид', 'рассроч', 'special', 'hot price', 'instalment', 'fırsat', 'taksit', 'عرض خاص', 'سعر مميز', 'تقسيط'].some((value) => lower.includes(value))) return 'purple';
  if (['эксклюзив', 'рекоменд', 'exclusive', 'featured', 'özel', 'حصري', 'موصى'].some((value) => lower.includes(value))) return 'secondary';
  return 'primary';
}
