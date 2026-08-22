import { notFound } from 'next/navigation';
import { LegalPage } from '@/components/legal/LegalPage';
import { isLocale } from '@/i18n/config';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} type="terms" />;
}
