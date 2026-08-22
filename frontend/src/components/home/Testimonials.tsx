import Link from 'next/link';

import { ReviewCard } from '@/components/reviews/ReviewCard';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { fetchReviews } from '@/lib/api';
import type { PublicReview } from '@/types';


export async function Testimonials({ locale }: { locale: Locale }) {
  const homeCopy = siteCopy[locale].home;
  const reviewCopy = siteCopy[locale].reviews;
  let reviews: PublicReview[] = [];
  try {
    const featured = await fetchReviews(locale, { featured: true, perPage: 3 });
    reviews = featured.items;
    if (!reviews.length) reviews = (await fetchReviews(locale, { perPage: 3 })).items;
  } catch {
    reviews = [];
  }

  return (
    <section className="bg-slate-50 py-12 sm:py-16 md:py-20">
      <div className="container mx-auto min-w-0 px-3 sm:px-4 md:px-6">
        <div className="mx-auto mb-8 min-w-0 max-w-3xl text-center sm:mb-12">
          <h2 className="mb-4 break-words text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">{homeCopy.testimonialsTitle}</h2>
          <p className="break-words text-base text-slate-600 sm:text-lg">{homeCopy.testimonialsDescription}</p>
        </div>
        {reviews.length ? (
          <div className="grid min-w-0 gap-5 sm:gap-6 md:grid-cols-3">{reviews.map((review) => <ReviewCard key={review.id} review={review} locale={locale} />)}</div>
        ) : (
          <div className="mx-auto min-w-0 max-w-2xl break-words rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-center text-slate-500 sm:p-8">{reviewCopy.empty}</div>
        )}
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={localizeHref(locale, '/reviews')} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-primary hover:text-primary">{reviewCopy.viewAll}</Link>
          <Link href={`${localizeHref(locale, '/reviews')}#leave-review`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-800">{reviewCopy.leaveReview}</Link>
        </div>
      </div>
    </section>
  );
}
