import { notFound } from 'next/navigation';

import { PropertiesPageContent } from '@/components/pages/PropertiesPageContent';
import { isLocale } from '@/i18n/config';


export const dynamic = 'force-dynamic';

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
