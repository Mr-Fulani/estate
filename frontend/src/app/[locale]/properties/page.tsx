import { indexableQuery } from '@/lib/query-policy';
import { assertPageExists, propertyQuery } from '@/lib/pagination';
import { fetchProperties } from '@/lib/api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PropertiesPageContent } from '@/components/pages/PropertiesPageContent';
import { isLocale } from '@/i18n/config';
import { localizedAlternates, staticPageMetadata } from '@/lib/seo';


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
  const metadata = await staticPageMetadata(locale, 'properties');
  const hasFilters = !indexableQuery(query);
  const filters = propertyQuery(query);
  const page = Number(filters.page);
  const data = await fetchProperties(filters);
  assertPageExists(page, data.total, data.per_page);
  if (hasFilters) return { ...metadata, robots: { index: false, follow: true } };
  if (page <= 1) return metadata;
  return {
    ...metadata,
    title: `${metadata.title} — ${page}`,
    openGraph: { ...metadata.openGraph, url: `/${locale}/properties?page=${page}` },
    alternates: {
      canonical: `/${locale}/properties?page=${page}`,
      languages: localizedAlternates(`/properties?page=${page}`),
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
