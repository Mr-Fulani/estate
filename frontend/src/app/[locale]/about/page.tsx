import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AboutPage from '../../about/page';
import { isLocale } from '@/i18n/config';
import { staticPageMetadata } from '@/lib/seo';


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? staticPageMetadata(locale, 'about') : {};
}


export default async function LocalizedAboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AboutPage />;
}
