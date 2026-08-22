import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ServicesPage from '../../services/page';
import { isLocale } from '@/i18n/config';
import { staticPageMetadata } from '@/lib/seo';


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? staticPageMetadata(locale, 'services') : {};
}


export default async function LocalizedServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ServicesPage />;
}
