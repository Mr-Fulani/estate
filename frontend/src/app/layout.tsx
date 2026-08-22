import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { LocaleProvider } from '@/context/LocaleContext';
import { assertLocale, localeDirection } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { fetchSiteSettings } from '@/lib/api';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Estate — Агентство недвижимости',
  description: 'Продажа, покупка и аренда недвижимости. Найдите свой идеальный дом с Estate.',
  openGraph: {
    title: 'Estate — Агентство недвижимости',
    description: 'Продажа, покупка и аренда недвижимости. Найдите свой идеальный дом с Estate.',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Estate',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Estate — агентство недвижимости' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estate — Агентство недвижимости',
    description: 'Продажа, покупка и аренда недвижимости. Найдите свой идеальный дом с Estate.',
    images: ['/og.png'],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const locale = assertLocale(requestHeaders.get('x-estate-locale') || 'ru');
  const messages = getMessages(locale);
  const siteSettings = await fetchSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${siteUrl}/#organization`,
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'Estate',
    url: siteUrl,
    telephone: siteSettings.phone,
    email: siteSettings.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Istanbul',
      addressRegion: 'Beylikdüzü',
      addressCountry: 'TR',
    },
    sameAs: [
      siteSettings.telegram,
      siteSettings.youtube,
      siteSettings.instagram,
      siteSettings.facebook,
    ].filter(Boolean),
  };

  return (
    <html lang={locale} dir={localeDirection(locale)} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}
        />
        <LocaleProvider locale={locale} messages={messages}>
          <AppShell siteSettings={siteSettings}>
            {children}
          </AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
