import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { fetchLandingPages } from '@/lib/api';
import { collectionsLabel, landingLocales } from '@/lib/landing-pages';

export async function CollectionsSection({ locale }: { locale: Locale }) {
  const pages = (await fetchLandingPages()).filter(page => page.is_published && landingLocales(page, [locale]).length);
  if (!pages.length) return null;

  return (
    <section className="bg-white py-16 md:py-20" aria-labelledby="services-collections-title">
      <div className="container mx-auto px-4 md:px-6">
        <h2 id="services-collections-title" className="mb-8 text-3xl font-bold text-slate-900 md:text-4xl">{collectionsLabel[locale]}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {pages.map(page => (
            <Link key={page.id} href={`/${locale}/collections/${page.slug}`} className="group rounded-3xl border border-slate-200 p-6 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:p-8">
              <div className="mb-3 flex items-start justify-between gap-4">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary">{page.translations[locale]!.title}</h3>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-primary rtl:rotate-180" aria-hidden="true" />
              </div>
              <p className="leading-relaxed text-slate-600">{page.translations[locale]!.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
