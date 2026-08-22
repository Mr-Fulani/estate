import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PropertiesPageContent } from '@/components/pages/PropertiesPageContent';
import { isLocale } from '@/i18n/config';
import { staticPageMetadata } from '@/lib/seo';


export const dynamic = 'force-dynamic';


export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) return {};
  const metadata = staticPageMetadata(locale, 'properties');
  const hasFilters = Object.entries(query).some(([key, value]) => key !== 'page' && value !== undefined && value !== '');
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = Math.max(1, Number(rawPage) || 1);
  if (hasFilters) return { ...metadata, robots: { index: false, follow: true } };
  if (page <= 1) return metadata;
  return {
    ...metadata,
    alternates: {
      canonical: `/${locale}/properties?page=${page}`,
      languages: {
        ru: `/ru/properties?page=${page}`,
        en: `/en/properties?page=${page}`,
        tr: `/tr/properties?page=${page}`,
        'x-default': `/ru/properties?page=${page}`,
      },
    },
  };
}

export default async function LocalizedPropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PropertiesPageContent searchParams={searchParams} locale={locale} />;
}
