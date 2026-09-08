import { getLocaleConfig } from '@/lib/runtime-locales';
import { getSiteOrigin } from '@/lib/site-config';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { LocaleProvider } from '@/context/LocaleContext';
import { assertLocale, documentLanguageTags, localeDirection } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { brandName } from '@/lib/site-profile';
import { fetchSiteSettings } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  const brand = brandName(settings);
  return {
    metadataBase: new URL(getSiteOrigin()),
    title: brand,
    icons: settings.profile?.icon_url ? { icon: settings.profile.icon_url, apple: settings.profile.icon_url } : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const localeConfig = getLocaleConfig();
  const locale = assertLocale(requestHeaders.get('x-estate-locale') || localeConfig.defaultLocale);
  const messages = getMessages(locale);
  const siteSettings = await fetchSiteSettings();
  const siteUrl = getSiteOrigin();
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${siteUrl}/#organization`,
    name: brandName(siteSettings),
    legalName: siteSettings.profile?.legal_name || undefined,
    logo: siteSettings.profile?.logo_url ? new URL(siteSettings.profile.logo_url, siteUrl).toString() : undefined,
    url: siteUrl,
    telephone: siteSettings.phone || undefined,
    email: siteSettings.email || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteSettings.address || undefined,
      addressLocality: siteSettings.profile?.address_locality || undefined,
      addressRegion: siteSettings.profile?.address_region || undefined,
      addressCountry: siteSettings.profile?.address_country || undefined,
      postalCode: siteSettings.profile?.postal_code || undefined,
    },
    sameAs: [
      siteSettings.telegram,
      siteSettings.youtube,
      siteSettings.instagram,
      siteSettings.facebook,
    ].filter(Boolean),
  };

  return (
    <html
      lang={documentLanguageTags[locale]}
      dir={localeDirection(locale)}
      className="notranslate"
      translate="no"
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content={documentLanguageTags[locale]} />
      </head>
      <body lang={documentLanguageTags[locale]} className="min-h-screen flex flex-col font-sans">
        {siteSettings.profile?.brand_name && <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({'@context':'https://schema.org','@graph':[organization,{'@type':'WebSite','@id':`${siteUrl}/#website`,url:siteUrl,name:brandName(siteSettings),publisher:{'@id':`${siteUrl}/#organization`},inLanguage:localeConfig.locales}]}).replace(/</g, '\\u003c') }}
        />}
        <LocaleProvider locale={locale} messages={messages} activeLocales={localeConfig.locales} defaultLocale={localeConfig.defaultLocale}>
          <AppShell siteSettings={siteSettings}>
            {children}
          </AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
