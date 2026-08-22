export const locales = ['ru', 'en', 'tr', 'ar'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

export const localeLabels: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  tr: 'Türkçe',
  ar: 'العربية',
};

export const localeTags: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-GB',
  tr: 'tr-TR',
  ar: 'ar-AE-u-nu-latn',
};

export const documentLanguageTags: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-GB',
  tr: 'tr-TR',
  ar: 'ar-AE',
};

export const openGraphLocales: Record<Locale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
  tr: 'tr_TR',
  ar: 'ar_AE',
};

export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

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
