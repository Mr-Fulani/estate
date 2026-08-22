import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ContactPage from '../../contact/page';
import { isLocale } from '@/i18n/config';
import { staticPageMetadata } from '@/lib/seo';


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? staticPageMetadata(locale, 'contact') : {};
}


export default async function LocalizedContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ContactPage />;
}
