import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = '₽'): string {
  if (price == null) return 'По запросу';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency === '₽' || currency === 'RUB' ? 'RUB' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace('RUB', '₽');
}

export function formatArea(area: number | null | undefined): string {
  if (area == null) return '-';
  return `${area} м²`;
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
  if (lower.includes('акт') || lower.includes('свобод')) return 'success';
  if (lower.includes('брон') || lower.includes('ожидан')) return 'warning';
  if (lower.includes('продан') || lower.includes('архив') || lower.includes('снят')) return 'danger';
  if (lower.includes('спец') || lower.includes('горяч') || lower.includes('скид')) return 'purple';
  if (lower.includes('эксклюзив') || lower.includes('рекоменд')) return 'secondary';
  return 'primary';
}
