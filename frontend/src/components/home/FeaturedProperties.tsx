import { fetchFeaturedProperties } from '@/lib/api';
import { PropertyGrid } from '../properties/PropertyGrid';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';

export async function FeaturedProperties({ locale }: { locale: Locale }) {
  const properties = await fetchFeaturedProperties();
  const copy = siteCopy[locale].home;

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {copy.featuredTitle}
            </h2>
            <p className="text-lg text-slate-600">
              {copy.featuredDescription}
            </p>
          </div>
          <Link href={localizeHref(locale, '/properties')} className="group inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary px-4 py-2 text-primary transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              {copy.viewAll}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        <PropertyGrid properties={properties} locale={locale} />
      </div>
    </section>
  );
}
