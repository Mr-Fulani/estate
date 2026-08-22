import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { NewsCard } from '@/components/news/NewsCard';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { fetchNews } from '@/lib/api';
import type { NewsArticle } from '@/types';

export async function LatestNews({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale].news;
  let articles: NewsArticle[] = [];

  try {
    articles = (await fetchNews(locale, 1, 2)).items;
  } catch {
    articles = [];
  }

  return (
    <section className="relative isolate overflow-hidden bg-primary-900 py-20 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              {copy.eyebrow}
            </span>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
            <p className="max-w-2xl text-lg leading-relaxed text-primary-100">{copy.description}</p>
          </div>

          <Link
            href={localizeHref(locale, '/news')}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-bold text-white transition hover:border-secondary/60 hover:bg-white/15 md:self-auto"
          >
            {copy.allArticles}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {articles.length ? (
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center text-primary-100">
            {copy.empty}
          </div>
        )}
      </div>
    </section>
  );
}
