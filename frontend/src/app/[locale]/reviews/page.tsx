import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { isLocale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { fetchReviewInvitation, fetchReviews } from '@/lib/api';


type ReviewsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; token?: string }>;
};


export async function generateMetadata({ params }: ReviewsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = siteCopy[locale].reviews;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: `/${locale}/reviews`,
      languages: { ru: '/ru/reviews', en: '/en/reviews', tr: '/tr/reviews', 'x-default': '/ru/reviews' },
    },
  };
}


export default async function ReviewsPage({ params, searchParams }: ReviewsPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const page = Math.max(1, Number(query.page) || 1);
  const copy = siteCopy[locale].reviews;
  const [reviewsResult, invitation] = await Promise.all([
    fetchReviews(locale, { page, perPage: 9 }).catch(() => ({ items: [], total: 0, page, per_page: 9 })),
    query.token ? fetchReviewInvitation(query.token).catch(() => null) : Promise.resolve(null),
  ]);
  const totalPages = Math.ceil(reviewsResult.total / reviewsResult.per_page);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-10 sm:py-14 md:py-20">
        <div className="container mx-auto min-w-0 max-w-4xl px-3 text-center sm:px-4 md:px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-secondary">Estate</p>
          <h1 className="break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-6xl">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl break-words text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">{copy.description}</p>
        </div>
      </section>

      <div className="container mx-auto min-w-0 px-3 py-8 sm:px-4 sm:py-12 md:px-6 md:py-16">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.7fr)] lg:gap-8">
          <section className="min-w-0">
            {reviewsResult.items.length ? (
              <div className="grid min-w-0 gap-5 sm:gap-6 md:grid-cols-2">{reviewsResult.items.map((review) => <ReviewCard key={review.id} review={review} locale={locale} />)}</div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">{copy.empty}</div>
            )}
            {totalPages > 1 && <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">{page > 1 && <Link href={`/${locale}/reviews?page=${page - 1}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">←</Link>}<span className="text-sm font-semibold text-slate-500">{page} / {totalPages}</span>{page < totalPages && <Link href={`/${locale}/reviews?page=${page + 1}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">→</Link>}</nav>}
          </section>
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            {query.token && !invitation && <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{copy.invitationInvalid}</p>}
            <ReviewForm locale={locale} token={invitation ? query.token : undefined} initialName={invitation?.reviewer_name || ''} propertyTitle={invitation?.property_title || undefined} />
          </aside>
        </div>
      </div>
    </main>
  );
}
