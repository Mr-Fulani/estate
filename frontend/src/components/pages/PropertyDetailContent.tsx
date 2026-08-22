import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { ContactForm } from '@/app/properties/[id]/ContactForm';
import { PropertyContactActions } from '@/components/contact/PropertyContactActions';
import { PropertyDetails } from '@/components/properties/PropertyDetails';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { localizedProperty } from '@/i18n/domain';
import { siteCopy } from '@/i18n/siteCopy';
import { fetchProperty } from '@/lib/api';

export async function PropertyDetailContent({ id, locale }: { id: string; locale: Locale }) {
  const property = await fetchProperty(id);
  const copy = siteCopy[locale].property;
  if (!property) notFound();
  const localized = localizedProperty(property, locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const canonicalUrl = new URL(`/${locale}/properties/${property.slug}`, siteUrl).toString();
  const absoluteImages = (property.images || []).map((image) => /^https?:\/\//i.test(image) ? image : new URL(image, siteUrl).toString());
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
    name: localized.title,
    description: localized.description || undefined,
    url: canonicalUrl,
    datePosted: property.created_at,
    dateModified: property.updated_at || property.created_at,
    inLanguage: locale,
    image: absoluteImages.length ? absoluteImages : undefined,
    about: {
      '@type': property.category?.slug === 'kvartira' ? 'Apartment' : 'House',
      name: localized.title,
      floorSize: property.area ? { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' } : undefined,
      numberOfRooms: property.rooms || undefined,
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
      <Link href={localizeHref(locale, '/properties')} className="mb-6 inline-flex items-center text-primary transition-colors hover:text-primary-600"><ArrowLeft className="mr-2 h-4 w-4" />{copy.back}</Link>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2"><PropertyDetails property={property} locale={locale} /></div>
        <div className="lg:col-span-1"><div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><h3 className="mb-2 text-2xl font-bold text-slate-900">{copy.interested}</h3><p className="mb-6 text-slate-600">{copy.interestedDescription}</p><ContactForm propertyId={property.id} /><PropertyContactActions propertyId={property.id} /></div></div>
      </div>
    </div>
  );
}
