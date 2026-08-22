import Link from 'next/link';

import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { Hero } from '@/components/home/Hero';
import { LatestNews } from '@/components/home/LatestNews';
import { Services } from '@/components/home/Services';
import { Testimonials } from '@/components/home/Testimonials';
import { CurrencyConverter } from '@/components/currency/CurrencyConverter';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';

export function HomePageContent({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale].home;
  return (
    <div className="relative isolate -mt-16 md:-mt-20">
      <Hero locale={locale} />
      <div className="relative z-10 overflow-clip rounded-t-[2rem] bg-slate-50 shadow-[0_-24px_60px_-32px_rgba(15,23,42,0.65)] sm:rounded-t-[2.5rem]">
        <FeaturedProperties locale={locale} />
        <Services locale={locale} />
        <CurrencyConverter locale={locale} />
        <LatestNews locale={locale} />
        <Testimonials locale={locale} />
        <section className="bg-primary py-20 text-white">
          <div className="container mx-auto max-w-4xl px-4 text-center md:px-6">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">{copy.ctaTitle}</h2>
            <p className="mb-10 text-lg text-primary-100 md:text-xl">{copy.ctaDescription}</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href={localizeHref(locale, '/contact')} className="inline-flex w-full items-center justify-center rounded-md bg-secondary px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 sm:w-auto">{copy.consultation}</Link>
              <Link href={localizeHref(locale, '/properties')} className="inline-flex w-full items-center justify-center rounded-md border-2 border-white px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary sm:w-auto">{copy.catalog}</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
