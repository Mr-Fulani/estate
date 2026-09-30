import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ContactPage from '../../contact/page';
import { isLocale } from '@/i18n/config';
import { staticPageMetadata } from '@/lib/seo';
import { developmentCopy } from '@/i18n/development';


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? staticPageMetadata(locale, 'contact') : {};
}


export default async function LocalizedContactPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const property = typeof query.property === 'string' ? query.property.slice(0, 200) : '';
  const unit = typeof query.unit === 'string' ? query.unit.slice(0, 80) : '';
  const plan = typeof query.plan === 'string' ? query.plan.slice(0, 80) : '';
  const contextMessage = property ? `${developmentCopy[locale].message}: ${property}${unit ? ` · ${unit}` : ''}${plan ? ` · ${plan}` : ''}` : undefined;
  return <ContactPage contextMessage={contextMessage} />;
}
