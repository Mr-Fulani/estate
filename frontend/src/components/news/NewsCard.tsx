import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Newspaper } from 'lucide-react';

import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { formatDate } from '@/lib/utils';
import type { NewsArticle } from '@/types';

export function NewsCard({ article, locale }: { article: NewsArticle; locale: Locale }) {
  const copy = siteCopy[locale].news;
  const articleHref = localizeHref(locale, `/news/${article.slug}`);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl">
      <Link href={articleHref} className="relative block aspect-[16/10] overflow-hidden bg-slate-100" aria-label={`${copy.readMore}: ${article.title}`}>
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 text-white">
            <Newspaper className="h-12 w-12 opacity-70" aria-hidden="true" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        {article.published_at && (
          <time dateTime={article.published_at} className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <CalendarDays className="h-4 w-4 text-secondary" aria-hidden="true" />
            {formatDate(article.published_at, locale)}
          </time>
        )}
        <h2 dir="auto" className="mb-3 text-xl font-bold leading-snug text-slate-900 md:text-2xl">
          <Link href={articleHref} className="transition-colors hover:text-primary">{article.title}</Link>
        </h2>
        <p dir="auto" className="mb-6 line-clamp-3 leading-relaxed text-slate-600">{article.excerpt}</p>
        <Link href={articleHref} className="mt-auto inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-secondary">
          {copy.readMore}<ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
