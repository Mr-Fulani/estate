import { fetchFeaturedProperties } from '@/lib/api';
import { PropertyGrid } from '../properties/PropertyGrid';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { fetchSiteSettings } from '@/lib/api';
import { getSiteCopy } from '@/lib/site-profile';

export async function FeaturedProperties({ locale }: { locale: Locale }) {
  const properties = await fetchFeaturedProperties();
  const copy = getSiteCopy(locale, await fetchSiteSettings()).home;

  return (
    <section id="featured-properties" className="scroll-mt-28 rounded-t-[2rem] bg-slate-50 py-20 shadow-[0_-24px_60px_-32px_rgba(15,23,42,0.65)] sm:rounded-t-[2.5rem]">
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
