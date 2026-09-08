import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { localizedProperty } from '@/i18n/domain';
import { developmentDemoCopy } from '@/i18n/development-demo';
import { developmentCopy } from '@/i18n/development';
import { CurrencyPrice } from '@/components/currency/CurrencyPrice';
import type { Property } from '@/types';

export function DevelopmentCard({ property: source, locale }: { property: Property; locale: Locale }) {
  const property = localizedProperty(source, locale);
  const copy = developmentCopy[locale];
  return <Link href={localizeHref(locale, `/properties/${property.slug}`)} className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#dedbd2] bg-[#f7f5ef] transition-shadow duration-300 hover:shadow-xl focus-visible:outline-secondary">
    <div className="relative aspect-[4/3] overflow-hidden bg-[#182a34]">
      {property.images[0] && <Image src={property.images[0]} alt={property.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transform-none" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#122530]/80 via-transparent to-transparent" />
      <span className="absolute start-4 top-4 border border-white/35 bg-[#142630]/60 px-3 py-1.5 text-[9px] uppercase tracking-[.13em] text-white backdrop-blur-sm">{property.development?.is_demo ? developmentDemoCopy[locale].badge : copy.project}</span>
      <p className="absolute bottom-4 start-5 text-[11px] tracking-wide text-white">{[property.district, property.city].filter(Boolean).join(' · ')}</p>
    </div>
    <div className="flex flex-1 flex-col p-5 text-[#182a34]">
      <p className="mb-3 text-[9px] uppercase tracking-[.15em] text-[#896b40]">{property.development?.design_brand || copy.collection}</p>
      <h3 className="font-serif text-[25px] leading-tight">{property.title}</h3>
      <p className="mt-3 text-xs text-[#535f60]" dir="ltr">{property.unit_types?.map(item => item.code).join(' / ')}</p>
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#dedbd2] pt-4"><div><p className="mb-1 text-[9px] text-[#535f60]">{property.development?.is_demo ? developmentDemoCopy[locale].price : property.development?.price_status === 'indicative' ? copy.indicative : copy.from}</p><p className="font-serif text-xl"><span className="text-sm">{copy.from} </span><CurrencyPrice amount={property.price} sourceCurrency={property.currency} locale={locale} /></p></div><ArrowUpRight size={22} className="text-[#94723e] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div>
    </div>
  </Link>;
}
