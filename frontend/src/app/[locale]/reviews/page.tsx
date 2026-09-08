import { indexableQuery } from '@/lib/query-policy';
import type { SearchQuery } from '@/lib/pagination';
import { assertPageExists, paginationPage } from '@/lib/pagination';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { isLocale } from '@/i18n/config';
import { fetchSiteSettings } from '@/lib/api';
import { getSiteCopy, brandName } from '@/lib/site-profile';
import { fetchReviewInvitation, fetchReviews } from '@/lib/api';
import { localizedPageMetadata } from '@/lib/seo';


type ReviewsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchQuery>;
};


export const dynamic = 'force-dynamic';


export async function generateMetadata({ params, searchParams }: ReviewsPageProps): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) return {};
  const copy = getSiteCopy(locale, await fetchSiteSettings()).reviews;
  const page = paginationPage(query.page);
  const pagination = await fetchReviews(locale, { page, perPage: 9 });
  assertPageExists(page, pagination.total, pagination.per_page);
  const title = copy.metaTitle;
  return localizedPageMetadata(locale, '/reviews', title, copy.metaDescription, {
    canonicalSuffix: page > 1 ? `?page=${page}` : '',
    index: indexableQuery(query),
  });
}


export default async function ReviewsPage({ params, searchParams }: ReviewsPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const token = typeof query.token === 'string' ? query.token : undefined;
  const page = paginationPage(query.page);
  const copy = getSiteCopy(locale, await fetchSiteSettings()).reviews;
  const [reviewsResult, invitation] = await Promise.all([
    fetchReviews(locale, { page, perPage: 9 }),
    token ? fetchReviewInvitation(token).catch(() => null) : Promise.resolve(null),
  ]);
  assertPageExists(page, reviewsResult.total, reviewsResult.per_page);
  const totalPages = Math.ceil(reviewsResult.total / reviewsResult.per_page);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-10 sm:py-14 md:py-20">
        <div className="container mx-auto min-w-0 max-w-4xl px-3 text-center sm:px-4 md:px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-secondary">{brandName(await fetchSiteSettings())}</p>
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
            {token && !invitation && <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{copy.invitationInvalid}</p>}
            <ReviewForm locale={locale} token={invitation ? token : undefined} initialName={invitation?.reviewer_name || ''} propertyTitle={invitation?.property_title || undefined} />
          </aside>
        </div>
      </div>
    </div>
  );
}
