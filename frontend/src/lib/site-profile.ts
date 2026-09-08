import type { SiteSettings } from '@/types';
import type { Locale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';

export type SeoPage = 'home' | 'properties' | 'services' | 'about' | 'contact' | 'news' | 'reviews' | 'privacy' | 'terms';
export interface SiteProfile {
  price_presets?: number[];
  brand_name?: string;
  legal_name?: string;
  logo_url?: string;
  icon_url?: string;
  og_image_url?: string;
  hero_image_url?: string;
  about_image_url?: string;
  address_locality?: string;
  address_region?: string;
  address_country?: string;
  postal_code?: string;
  seo?: Partial<Record<Locale, Partial<Record<SeoPage, { title: string; description: string }>>>>;
  copy?: Partial<Record<Locale, Record<string, string>>>;
}

export function brandName(settings: SiteSettings): string {
  return settings.profile?.brand_name?.trim() || 'Real estate';
}

export function brandInitials(settings: SiteSettings): string {
  return brandName(settings).split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();
}

/** Walk the trusted template; unrecognized override paths are never executed or merged. */
export function applyCopy<T>(template: T, overrides: Record<string, string>, brand: string, prefix = ''): T {
  if (typeof template === 'string') return (overrides[prefix] ?? template).replaceAll('{brand}', brand) as T;
  if (Array.isArray(template)) return template.map((value, index) => applyCopy(value, overrides, brand, `${prefix}.${index}`)) as T;
  if (template && typeof template === 'object') return Object.fromEntries(Object.entries(template).map(([key, value]) => [key, applyCopy(value, overrides, brand, prefix ? `${prefix}.${key}` : key)])) as T;
  return template;
}

export function getSiteCopy(locale: Locale, settings: SiteSettings) {
  return applyCopy(siteCopy[locale], settings.profile?.copy?.[locale] || {}, brandName(settings));
}

export function copyFields(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => copyFields(item, prefix ? `${prefix}.${key}` : key));
  return [];
}
