import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isLocale, locales } from '@/i18n/config';


const metadataByLocale = {
  ru: {
    title: 'Estate — агентство недвижимости',
    description: 'Подбор, покупка и продажа недвижимости с полным сопровождением.',
  },
  en: {
    title: 'Estate — real estate agency',
    description: 'Property search, purchase and sales with end-to-end support.',
  },
  tr: {
    title: 'Estate — gayrimenkul danışmanlığı',
    description: 'Uçtan uca destekle gayrimenkul arama, satın alma ve satış hizmetleri.',
  },
} as const;


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = metadataByLocale[locale];
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { ru: '/ru', en: '/en', tr: '/tr' },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Estate',
      locale: locale === 'ru' ? 'ru_RU' : locale === 'tr' ? 'tr_TR' : 'en_US',
      type: 'website',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: copy.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: ['/og.png'],
    },
  };
}


export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return children;
}
