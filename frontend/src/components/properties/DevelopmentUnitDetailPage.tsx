import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Building2, MapPin, Maximize, Shapes, Sparkles } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { localizedProperty } from '@/i18n/domain';
import { developmentCopy } from '@/i18n/development';
import { CurrencyPrice } from '@/components/currency/CurrencyPrice';
import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { getMessages } from '@/i18n/messages';
import { getSiteOrigin } from '@/lib/site-config';
import { fetchSiteSettings } from '@/lib/api';
import { getSiteCopy } from '@/lib/site-profile';
import type { Property, PropertyUnitType } from '@/types';
import { propertyVideoSchema, unitSeoDescription } from '@/lib/property-seo';
import { displayImageUrl, isDriveImage } from '@/lib/video-media';

export async function DevelopmentUnitDetailPage({ property: source, unit, locale }: { property: Property; unit: PropertyUnitType; locale: Locale }) {
  const settings = await fetchSiteSettings();
  const siteCopy = getSiteCopy(locale, settings);
  const propertyCopy = siteCopy.property;
  const property = localizedProperty(source, locale);
  const copy = developmentCopy[locale];
  const location = [property.district, property.city, property.address].filter(Boolean).join(', ');
  const formatArea = (value: number) => `${value.toLocaleString(locale, { maximumFractionDigits: 2 })} m²`;
  const area = unit.area_min === null || unit.area_max === null
    ? copy.areaOnRequest
    : unit.area_min === unit.area_max
      ? formatArea(unit.area_min)
      : `${formatArea(unit.area_min)}–${formatArea(unit.area_max)}`;
  const price = unit.price_min === null || unit.price_max === null
    ? copy.priceOnRequest
    : <><CurrencyPrice amount={unit.price_min} sourceCurrency={property.currency} locale={locale} />{unit.price_max !== unit.price_min && <> – <CurrencyPrice amount={unit.price_max} sourceCurrency={property.currency} locale={locale} /></>}</>;
  const title = `${property.title} · ${unit.code}`;
  const projectName = property.title.split(/\s+[—–]\s+/)[0];
  const unitPath = encodeURIComponent(unit.code.trim().toLowerCase().replace(/\s+/g, '-'));
  const detailPath = `/${locale}/properties/${property.slug}/${unitPath}`;
  const contactHref = `${localizeHref(locale, '/contact')}?property=${encodeURIComponent(property.slug)}&unit=${encodeURIComponent(unit.code)}`;
  const breadcrumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { name: getMessages(locale).navigation.home, href: `/${locale}` },
      { name: siteCopy.catalog.title, href: `/${locale}/properties` },
      { name: property.title, href: `/${locale}/properties/${property.slug}` },
      { name: unit.code, href: detailPath },
    ].map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: new URL(item.href, getSiteOrigin()).toString() })),
  };
  const videoData = propertyVideoSchema(unit.video_url ? [unit.video_url] : [], title, locale, new URL(detailPath, getSiteOrigin()).toString(), getSiteOrigin());
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'RealEstateListing',
    name: title, description: unitSeoDescription(property, unit, locale),
    url: detailPath,
    image: unit.media_images || [], inLanguage: locale,
    about: {
      '@type': 'Accommodation', name: title,
      numberOfRooms: unit.rooms,
      floorSize: unit.area_min !== null && unit.area_max !== null ? { '@type': 'QuantitativeValue', minValue: unit.area_min, maxValue: unit.area_max, unitCode: 'MTK' } : undefined,
      address: { '@type': 'PostalAddress', streetAddress: property.address || undefined, addressLocality: property.city || undefined, addressRegion: property.district || undefined },
    },
    offers: unit.price_min !== null && unit.price_max !== null ? { '@type': 'AggregateOffer', lowPrice: unit.price_min, highPrice: unit.price_max, priceCurrency: property.currency } : undefined,
  };

  return <main className="container mx-auto min-h-screen bg-slate-50 px-4 py-8 md:px-6 md:py-12">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    {videoData.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoData).replace(/</g, '\\u003c') }} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }} />
    <Link href={`/${locale}/properties/${property.slug}`} aria-label={`${copy.backToProject}: ${property.title}`} className="mb-6 inline-flex min-h-11 max-w-full items-center gap-2 text-sm text-slate-600 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      <ArrowLeft className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" /><span dir="auto">{projectName}</span>
    </Link>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
      <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
        <div className="p-4 pb-0 md:p-6 md:pb-0">
          <PropertyGallery
            images={unit.media_images || []}
            videos={unit.video_url ? [unit.video_url] : []}
            title={title}
            isFeatured={property.is_featured}
            isActive={property.is_active}
            statusBadge={property.status_badge}
          />
        </div>
        <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-w-0 p-4 sm:p-6 md:p-8">
          <h1 className="mb-3 text-2xl font-bold text-slate-900 md:text-4xl" dir="auto">{unit.code}</h1>
          <div className="mb-6 flex flex-wrap items-baseline gap-x-2 text-2xl font-black text-primary sm:text-3xl 2xl:text-4xl">{price}</div>
          {location && <div className="mb-8 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-base text-slate-600 md:text-lg">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span dir="auto">{location}</span>
          </div>}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{propertyCopy.parameters}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Fact icon={<Shapes className="h-5 w-5" />} label={copy.plan} value={unit.code} />
              <Fact icon={<Maximize className="h-5 w-5" />} label={copy.area} value={area} />
              <Fact icon={<Building2 className="h-5 w-5" />} label={copy.developer} value={source.development?.developer || propertyCopy.unspecified} />
              <Fact icon={<Sparkles className="h-5 w-5" />} label={copy.design} value={source.development?.design_brand || propertyCopy.unspecified} />
            </div>
          </section>
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{propertyCopy.description}</h2>
            <div className="max-w-none space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
              {property.description
                ? property.description.split('\n').map((paragraph, index) => <p dir="auto" key={index}>{paragraph}</p>)
                : <p className="italic text-slate-400">{propertyCopy.noDescription}</p>}
            </div>
          </section>
          {unit.plans.length > 0 && <section className="border-t border-slate-100 pt-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">{copy.plan}</h2>
            <div className={`grid gap-4${unit.plans.length > 1 ? ' sm:grid-cols-2' : ''}`}>{unit.plans.map((plan, index) => <a key={`${plan}-${index}`} href={plan} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Image src={displayImageUrl(plan)} alt={`${copy.plan} ${unit.code} ${index + 1}`} fill unoptimized={isDriveImage(plan)} sizes="(max-width: 640px) 100vw, 40vw" className="object-contain p-3" />
            </a>)}</div>
          </section>}
          <p className="mt-6 text-sm leading-relaxed text-slate-500">{copy.planNote}</p>
        </div>
      </article>
      <aside className="min-w-0 h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-28 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">{propertyCopy.interested}</h2>
        <p className="mb-6 text-slate-600">{propertyCopy.interestedDescription}</p>
        <Link href={contactHref} className="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700">
          {copy.availability}<ArrowUpRight className="h-4 w-4" />
        </Link>
      </aside>
    </div>
  </main>;
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50 p-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
    <div className="min-w-0 break-words"><p className="text-xs font-medium text-slate-500">{label}</p><p className="text-sm font-bold text-slate-900 md:text-base" dir="auto">{value}</p></div>
  </div>;
}
