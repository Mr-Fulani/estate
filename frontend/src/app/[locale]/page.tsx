import { notFound } from 'next/navigation';

import { HomePageContent } from '@/components/pages/HomePageContent';
import { isLocale } from '@/i18n/config';


export const dynamic = 'force-dynamic';


export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePageContent locale={locale} />;
}
