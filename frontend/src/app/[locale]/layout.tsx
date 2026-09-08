import { getLocaleConfig } from '@/lib/runtime-locales';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale } from '@/i18n/config';
import { staticPageMetadata } from '@/lib/seo';


export function generateStaticParams() {
  return getLocaleConfig().locales.map((locale) => ({ locale }));
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return staticPageMetadata(locale, 'home');
}


export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || !getLocaleConfig().locales.includes(locale)) notFound();
  return children;
}
