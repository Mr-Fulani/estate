import { RelatedProperties } from '@/components/properties/RelatedProperties';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { propertySchemaType } from '@/lib/structured-data';
import { getMessages } from '@/i18n/messages';
import { getLocaleConfig, defaultAvailableLocale } from '@/lib/runtime-locales';
import { getSiteOrigin } from '@/lib/site-config';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { ContactForm } from '@/app/properties/[id]/ContactForm';
import { PropertyContactActions } from '@/components/contact/PropertyContactActions';
import { PropertyDetails } from '@/components/properties/PropertyDetails';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { hasPropertyLocale, localizedProperty, propertyAvailableLocales } from '@/i18n/domain';
import { fetchSiteSettings } from '@/lib/api';
import { getSiteCopy } from '@/lib/site-profile';
import { fetchProperty } from '@/lib/api';
import type { Property } from '@/types';
import { DevelopmentPage } from '@/components/properties/DevelopmentPage';

export async function PropertyDetailContent({ id, locale, initialProperty }: { id: string; locale: Locale; initialProperty?: Property }) {
  const property = initialProperty || await fetchProperty(id);
  const settings = await fetchSiteSettings();
  const allCopy = getSiteCopy(locale, settings);
  const copy = allCopy.property;
  if (!property) notFound();
  const available = propertyAvailableLocales(property).filter(value=>getLocaleConfig().locales.includes(value));
  if (!available.length) notFound();
  const contentLocale = available.includes(locale) ? locale : defaultAvailableLocale(available);
  const localized = localizedProperty(property, contentLocale);
  const siteUrl = getSiteOrigin();
  const canonicalUrl = new URL(`/${contentLocale}/properties/${property.slug}`, siteUrl).toString();
  const absoluteImages = (property.images || []).map((image) => /^https?:\/\//i.test(image) ? image : new URL(image, siteUrl).toString());
  const breadcrumbs = <Breadcrumbs items={[{name:getMessages(locale).navigation.home,href:`/${locale}`},{name:allCopy.catalog.title,href:`/${locale}/properties`},{name:localized.title,href:`/${contentLocale}/properties/${property.slug}`}]} />;
  if (property.listing_kind === 'development' && property.development) {
    if (property.development.is_demo) return <DevelopmentPage property={property} locale={contentLocale} />;
    const developmentData = {
      '@context': 'https://schema.org', '@type': 'ApartmentComplex',
      name: localized.title, description: localized.description, url: canonicalUrl,
      image: absoluteImages,
      address: { '@type': 'PostalAddress', streetAddress: localized.address, addressLocality: localized.city, addressRegion: localized.district },
    };
    return <><div className="container mx-auto px-4 pt-6">{breadcrumbs}</div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(developmentData).replace(/</g, '\\u003c') }} /><DevelopmentPage property={property} locale={contentLocale} /></>;
  }
  const availability = {
    available: 'https://schema.org/InStock',
    reserved: 'https://schema.org/LimitedAvailability',
    sold: 'https://schema.org/SoldOut',
    rented: 'https://schema.org/OutOfStock',
    archived: 'https://schema.org/Discontinued',
  }[property.market_status] || 'https://schema.org/InStock';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${canonicalUrl}#listing`,
    isPartOf: { '@id': `${siteUrl}/#website` },
    publisher: settings.profile?.brand_name ? { '@id': `${siteUrl}/#organization` } : undefined,
    name: localized.title,
    description: localized.description || undefined,
    url: canonicalUrl,
    datePosted: property.created_at,
    dateModified: property.updated_at || property.created_at,
    inLanguage: contentLocale,
    image: absoluteImages.length ? absoluteImages : undefined,
    about: {
      '@type': propertySchemaType(property.category),
      name: localized.title,
      floorSize: propertySchemaType(property.category) !== 'Place' && property.area ? { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' } : undefined,
      numberOfRooms: propertySchemaType(property.category) !== 'Place' ? property.rooms || undefined : undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: localized.address || undefined,
        addressLocality: localized.city || undefined,
        addressRegion: localized.district || undefined,
      },
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      price: property.price,
      priceCurrency: property.currency,
      availability,
      businessFunction: property.transaction_type === 'rent'
        ? 'http://purl.org/goodrelations/v1#LeaseOut'
        : 'http://purl.org/goodrelations/v1#Sell',
    },
  };

  return (
    <div className="container mx-auto min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      {breadcrumbs}
      <Link href={localizeHref(locale, '/properties')} className="mb-6 inline-flex items-center text-primary transition-colors hover:text-primary-600"><ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />{copy.back}</Link>
      {!hasPropertyLocale(property, locale) && <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{copy.fallbackNotice}</p>}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2"><div lang={contentLocale} dir={contentLocale === 'ar' ? 'rtl' : 'ltr'}><PropertyDetails property={property} locale={contentLocale} /></div></div>
        <div className="lg:col-span-1"><div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><h2 className="mb-2 text-2xl font-bold text-slate-900">{copy.interested}</h2><p className="mb-6 text-slate-600">{copy.interestedDescription}</p><ContactForm propertyId={property.id} /><PropertyContactActions propertyId={property.id} /></div></div>
      </div>
      <RelatedProperties property={property} locale={locale} title={copy.related} />
    </div>
  );
}
