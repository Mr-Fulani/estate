import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';

import { NewsMediaGallery } from '@/components/news/NewsMediaGallery';
import { isLocale, localizeHref } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { fetchNewsArticle } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type NewsArticlePageProps = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = 'force-dynamic';


function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').toString();
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = await fetchNewsArticle(slug, locale);
  if (!article) return { title: siteCopy[locale].news.metaTitle };

  const title = article.meta_title || article.title;
  const description = article.meta_description || article.excerpt;
  const hasRequestedLocale = article.locale === locale;
  const canonicalLocale = hasRequestedLocale ? locale : article.locale;
  const languages = Object.fromEntries([
    ...article.available_locales.map((availableLocale) => [availableLocale, `/${availableLocale}/news/${slug}`]),
    ['x-default', `/ru/news/${slug}`],
  ]);
  const images = article.cover_image ? [{ url: absoluteUrl(article.cover_image), alt: article.title }] : [];

  return {
    title,
    description,
    alternates: { canonical: `/${canonicalLocale}/news/${slug}`, languages },
    robots: hasRequestedLocale ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: 'article',
      url: absoluteUrl(`/${canonicalLocale}/news/${slug}`),
      publishedTime: article.published_at || undefined,
      authors: [article.author],
      images,
    },
    twitter: {
      card: article.cover_image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = await fetchNewsArticle(slug, locale);
  if (!article) notFound();

  const copy = siteCopy[locale].news;
  const paragraphs = article.content.split(/\n{2,}/).filter(Boolean);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: [article.cover_image, ...(article.media ?? []).filter((item) => item.media_type === 'image').map((item) => item.url)].filter((item): item is string => Boolean(item)).map(absoluteUrl),
    datePublished: article.published_at || undefined,
    mainEntityOfPage: absoluteUrl(`/${article.locale}/news/${article.slug}`),
    author: { '@type': 'Organization', name: article.author },
    inLanguage: article.locale,
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <article>
        <header className="border-b border-slate-200 bg-slate-50">
          <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
            <Link href={localizeHref(locale, '/news')} className="mb-8 inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />{copy.back}
            </Link>
            {article.locale !== locale && (
              <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{copy.fallbackNotice}</p>
            )}
            <h1 className="mb-6 max-w-4xl text-4xl font-bold leading-tight text-slate-950 md:text-6xl">{article.title}</h1>
            <p className="mb-7 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">{article.excerpt}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
              {article.published_at && <time dateTime={article.published_at} className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-secondary" aria-hidden="true" />{formatDate(article.published_at, locale)}</time>}
              <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-secondary" aria-hidden="true" />{copy.by}: {article.author}</span>
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
          {article.cover_image && (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 shadow-sm md:mb-14">
              <Image src={article.cover_image} alt={article.title} fill priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
            </div>
          )}
          <div className="mx-auto max-w-3xl space-y-6 text-lg leading-8 text-slate-700">
            {paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
          </div>
          <NewsMediaGallery media={article.media ?? []} title={article.title} locale={locale} coverImage={article.cover_image} />
        </div>
      </article>
    </main>
  );
}
