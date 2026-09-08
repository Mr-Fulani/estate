import { assertPageExists, paginationPage } from '@/lib/pagination';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { NewsCard } from '@/components/news/NewsCard';
import { isLocale, localizeHref } from '@/i18n/config';
import { fetchSiteSettings } from '@/lib/api';
import { getSiteCopy } from '@/lib/site-profile';
import { fetchNews } from '@/lib/api';
import { localizedPageMetadata } from '@/lib/seo';

type NewsListPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }: NewsListPageProps): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) return {};
  const copy = getSiteCopy(locale, await fetchSiteSettings()).news;
  const page = paginationPage(query.page);
  const pagination = await fetchNews(locale, page, 9);
  assertPageExists(page, pagination.total, pagination.per_page);
  const title = copy.metaTitle;
  return localizedPageMetadata(locale, '/news', title, copy.metaDescription, {
    canonicalSuffix: page > 1 ? `?page=${page}` : '',
  });
}

export default async function NewsListPage({ params, searchParams }: NewsListPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const page = paginationPage(query.page);
  const data = await fetchNews(locale, page, 9);
  assertPageExists(page, data.total, data.per_page);
  const totalPages = Math.ceil(data.total / data.per_page);
  const copy = getSiteCopy(locale, await fetchSiteSettings()).news;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-primary-800 bg-primary-900 py-16 text-white md:py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-secondary">{copy.eyebrow}</span>
          <h1 className="mx-auto mb-5 max-w-4xl text-4xl font-bold md:text-5xl">{copy.title}</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-primary-100">{copy.description}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        {data.items.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {data.items.map((article) => <NewsCard key={article.id} article={article} locale={locale} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center text-lg text-slate-500">{copy.empty}</div>
        )}

        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-3" aria-label={copy.page}>
            {page > 1 ? (
              <Link href={`${localizeHref(locale, '/news')}?page=${page - 1}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:border-primary hover:text-primary">{copy.previous}</Link>
            ) : <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 font-semibold text-slate-400" aria-disabled="true">{copy.previous}</span>}
            <span className="px-2 text-sm font-medium text-slate-600">{copy.page} {page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={`${localizeHref(locale, '/news')}?page=${page + 1}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:border-primary hover:text-primary">{copy.next}</Link>
            ) : <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 font-semibold text-slate-400" aria-disabled="true">{copy.next}</span>}
          </nav>
        )}
      </section>
    </div>
  );
}
