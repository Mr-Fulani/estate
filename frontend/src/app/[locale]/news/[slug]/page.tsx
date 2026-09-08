import { RichText } from '@/components/content/RichText';
import { imageText } from '@/lib/image-text';
import { readyForIndexing } from '@/lib/indexing';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { articleAuthor } from '@/lib/structured-data';
import { getMessages } from '@/i18n/messages';
import { getLocaleConfig, defaultAvailableLocale } from '@/lib/runtime-locales';
import { getSiteOrigin } from '@/lib/site-config';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';

import { NewsMediaGallery } from '@/components/news/NewsMediaGallery';
import { isLocale, localizeHref, openGraphLocales } from '@/i18n/config';
import { fetchSiteSettings } from '@/lib/api';
import { getSiteCopy } from '@/lib/site-profile';
import { fetchNewsArticle } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type NewsArticlePageProps = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = 'force-dynamic';


function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, getSiteOrigin()).toString();
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = await fetchNewsArticle(slug, locale);
  if (!article) notFound();
  if (slug !== article.slug) permanentRedirect(`/${locale}/news/${article.slug}`);

  const title = article.meta_title || article.title;
  const description = article.meta_description || article.excerpt;
  const hasRequestedLocale = article.locale === locale;
  const canonicalLocale = hasRequestedLocale ? locale : article.locale;
  const languages = Object.fromEntries([
    ...article.available_locales.filter(value => getLocaleConfig().locales.includes(value)).map((availableLocale) => [availableLocale, `/${availableLocale}/news/${slug}`]),
    ['x-default', `/${defaultAvailableLocale(article.available_locales)}/news/${slug}`],
  ]);
  const images = article.cover_image ? [{ url: absoluteUrl(article.cover_image), alt: article.title }] : [];

  return {
    title,
    description,
    alternates: { canonical: `/${canonicalLocale}/news/${slug}`, languages },
    robots: { index: hasRequestedLocale && readyForIndexing(await fetchSiteSettings()), follow: true },
    openGraph: {
      title,
      description,
      type: 'article',
      url: absoluteUrl(`/${canonicalLocale}/news/${slug}`),
      locale: openGraphLocales[canonicalLocale],
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || undefined,
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
  if (slug !== article.slug) permanentRedirect(`/${locale}/news/${article.slug}`);

  const settings = await fetchSiteSettings();
  const copy = getSiteCopy(locale, settings).news;
  const coverText = imageText(article.image_details, article.cover_image || '', article.locale, article.title);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: [article.cover_image, ...(article.media ?? []).filter((item) => item.media_type === 'image').map((item) => item.url)].filter((item): item is string => Boolean(item)).map(absoluteUrl),
    datePublished: article.published_at || undefined,
    mainEntityOfPage: absoluteUrl(`/${article.locale}/news/${article.slug}`),
    author: articleAuthor(article, settings, getSiteOrigin()),
    publisher: settings.profile?.brand_name ? { '@id': `${getSiteOrigin()}/#organization` } : undefined,
    isPartOf: { '@id': `${getSiteOrigin()}/#website` },
    dateModified: article.updated_at || undefined,
    inLanguage: article.locale,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <article lang={article.locale} dir={article.locale === 'ar' ? 'rtl' : 'ltr'}>
        <header className="border-b border-slate-200 bg-slate-50">
          <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
            <Breadcrumbs items={[{name:getMessages(locale).navigation.home,href:`/${locale}`},{name:copy.title,href:`/${locale}/news`},{name:article.title,href:`/${article.locale}/news/${article.slug}`}]} />
            <Link href={localizeHref(locale, '/news')} className="mb-8 inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-secondary">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{copy.back}
            </Link>
            {article.locale !== locale && (
              <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{copy.fallbackNotice}</p>
            )}
            <h1 dir="auto" className="mb-6 max-w-4xl text-4xl font-bold leading-tight text-slate-950 md:text-6xl">{article.title}</h1>
            <p dir="auto" className="mb-7 max-w-3xl text-lg leading-relaxed text-slate-600 md:text-xl">{article.excerpt}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
              {article.published_at && <time dateTime={article.published_at} className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-secondary" aria-hidden="true" />{formatDate(article.published_at, locale)}</time>}
              <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-secondary" aria-hidden="true" />{copy.by}: {article.author_url ? <a href={article.author_url}>{article.author}</a> : article.author}</span>
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
          {article.cover_image && (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 shadow-sm md:mb-14">
              <Image src={article.cover_image} alt={coverText.alt} fill preload loading="eager" sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
            </div>
          )}
          {coverText.caption && <p className="mb-8 text-sm text-slate-500">{coverText.caption}</p>}
          <div className="mx-auto max-w-3xl space-y-6 text-lg leading-8 text-slate-700">
            <RichText content={article.content} />
          </div>
          <NewsMediaGallery media={article.media ?? []} title={article.title} locale={article.locale} imageDetails={article.image_details} coverImage={article.cover_image} />
        </div>
      </article>
    </div>
  );
}
