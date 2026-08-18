import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = '₽'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency === '₽' || currency === 'RUB' ? 'RUB' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace('RUB', '₽');
}

export function formatArea(area: number): string {
  return `${area} м²`;
}

export function pluralize(n: number, forms: [string, string, string]): string {
  n = Math.abs(n) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) {
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
