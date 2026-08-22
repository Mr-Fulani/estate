import { BadgeCheck, Quote, Star } from 'lucide-react';

import type { Locale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import type { PublicReview } from '@/types';


export function ReviewCard({ review, locale }: { review: PublicReview; locale: Locale }) {
  const copy = siteCopy[locale].reviews;
  return (
    <article className="relative flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
      <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10 sm:right-6 sm:top-6 sm:h-10 sm:w-10" aria-hidden="true" />
      <div className="mb-5 flex items-center gap-1 pr-10 sm:pr-12" aria-label={`${review.rating} / 5`}>
        {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} aria-hidden="true" />)}
      </div>
      <p className="relative z-10 min-w-0 max-w-full flex-1 break-words text-base italic leading-7 text-slate-700 [overflow-wrap:anywhere]">&ldquo;{review.content}&rdquo;</p>
      {review.company_response && (
        <div className="mt-5 min-w-0 max-w-full rounded-2xl border border-primary/10 bg-primary/5 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{copy.companyResponse}</p>
          <p className="break-words text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{review.company_response}</p>
        </div>
      )}
      <footer className="mt-6 flex min-w-0 items-start gap-3 border-t border-slate-100 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-black text-white">{review.reviewer_name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <p className="break-words font-bold leading-5 text-slate-900 [overflow-wrap:anywhere]">{review.reviewer_name}</p>
          <p className="mt-0.5 break-words text-sm leading-5 text-slate-500 [overflow-wrap:anywhere]">{review.reviewer_role || review.property_title || ''}</p>
          {review.is_verified && <span className="mt-1 inline-flex max-w-full items-center gap-1 break-words text-xs font-bold text-emerald-700"><BadgeCheck className="h-3.5 w-3.5 shrink-0" />{copy.verified}</span>}
        </div>
      </footer>
    </article>
  );
}
