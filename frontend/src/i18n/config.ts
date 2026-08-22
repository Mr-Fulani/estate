export const locales = ['ru', 'en', 'tr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

export const localeLabels: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  tr: 'Türkçe',
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function assertLocale(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function localizeHref(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('/admin')) return href;
  if (href === '/') return `/${locale}`;

  const segments = href.split('/');
  if (segments[1] && isLocale(segments[1])) {
    segments[1] = locale;
    return segments.join('/');
  }

  return `/${locale}${href}`;
}

