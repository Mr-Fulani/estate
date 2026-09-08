import { locales, isLocale, type Locale } from '@/i18n/config';

export function getLocaleConfig(): { locales: Locale[]; defaultLocale: Locale } {
  const active = (process.env.SITE_LOCALES || locales.join(',')).split(',').map(value => value.trim());
  const primary = process.env.SITE_DEFAULT_LOCALE || active[0];
  if (!active.length || new Set(active).size !== active.length || !active.every(isLocale) || !isLocale(primary) || !active.includes(primary)) {
    throw new Error('SITE_LOCALES must contain unique supported languages and include SITE_DEFAULT_LOCALE');
  }
  return { locales: active as Locale[], defaultLocale: primary };
}

export function defaultAvailableLocale(available: readonly Locale[]): Locale {
  const config = getLocaleConfig();
  return available.includes(config.defaultLocale) ? config.defaultLocale : available.find(locale => config.locales.includes(locale)) || config.defaultLocale;
}
