import type { Locale } from '@/i18n/config';

export type ImageDetails = Record<string, Partial<Record<Locale, { alt?: string; caption?: string; decorative?: boolean }>>>;

export function imageText(details: ImageDetails | undefined, url: string, locale: Locale, fallback: string) {
  const text = details?.[url]?.[locale];
  return { alt: text?.decorative ? '' : text?.alt?.trim() || fallback, caption: text?.caption?.trim() || '' };
}
