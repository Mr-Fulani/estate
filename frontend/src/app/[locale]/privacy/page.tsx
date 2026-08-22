import { notFound } from 'next/navigation';
import { LegalPage } from '@/components/legal/LegalPage';
import { isLocale } from '@/i18n/config';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} type="privacy" />;
}
