'use client';

import { useState } from 'react';
import { CheckCircle2, Star } from 'lucide-react';

import type { Locale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { submitReview } from '@/lib/api';


export function ReviewForm({
  locale,
  token,
  initialName = '',
  propertyTitle,
}: {
  locale: Locale;
  token?: string;
  initialName?: string;
  propertyTitle?: string;
}) {
  const copy = siteCopy[locale].reviews;
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    if (!token && !String(form.get('email') || '').trim() && !String(form.get('phone') || '').trim()) {
      setError(copy.error);
      setLoading(false);
      return;
    }
    try {
      await submitReview({
        reviewer_name: String(form.get('reviewer_name') || ''),
        email: String(form.get('email') || '') || undefined,
        phone: String(form.get('phone') || '') || undefined,
        rating,
        locale,
        content: String(form.get('content') || ''),
        reviewer_role: String(form.get('reviewer_role') || '') || undefined,
        consent_given: true,
        website: String(form.get('website') || ''),
      }, token);
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error && submitError.message ? submitError.message : copy.error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <div className="min-w-0 max-w-full rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center sm:p-8" role="status"><CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" /><h2 className="break-words text-xl font-bold text-emerald-950 sm:text-2xl">{copy.successTitle}</h2><p className="mt-2 break-words text-emerald-800">{copy.successDescription}</p></div>;
  }

  return (
    <form id="leave-review" onSubmit={handleSubmit} className="min-w-0 max-w-full space-y-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
      <div className="min-w-0"><h2 className="break-words text-xl font-bold text-slate-950 sm:text-2xl">{copy.leaveTitle}</h2><p className="mt-2 break-words text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{propertyTitle ? `${copy.leaveDescription} ${propertyTitle}` : copy.leaveDescription}</p></div>
      {error && <p className="break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 [overflow-wrap:anywhere]" role="alert">{error}</p>}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-sm font-semibold text-slate-700">{copy.name}<input name="reviewer_name" required minLength={2} maxLength={100} defaultValue={initialName} autoComplete="name" dir="auto" className="mt-2 h-11 min-w-0 w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /></label>
        <label className="min-w-0 text-sm font-semibold text-slate-700">{copy.role}<input name="reviewer_role" maxLength={160} placeholder={locale === 'ru' ? 'Покупатель квартиры' : locale === 'tr' ? 'Daire alıcısı' : locale === 'ar' ? 'مشتري شقة' : 'Apartment buyer'} dir="auto" className="mt-2 h-11 min-w-0 w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /></label>
        {!token && <><label className="min-w-0 text-sm font-semibold text-slate-700">{copy.phone}<input name="phone" type="tel" autoComplete="tel" maxLength={30} dir="ltr" className="mt-2 h-11 min-w-0 w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /></label><label className="min-w-0 text-sm font-semibold text-slate-700">{copy.email}<input name="email" type="email" autoComplete="email" dir="ltr" className="mt-2 h-11 min-w-0 w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /></label></>}
      </div>
      <fieldset className="min-w-0"><legend className="mb-2 text-sm font-semibold text-slate-700">{copy.rating}</legend><div className="flex max-w-full justify-between gap-1 sm:justify-start sm:gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className="shrink-0 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${value} / 5`} aria-pressed={rating === value}><Star className={`h-7 w-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}</div></fieldset>
      <label className="block min-w-0 text-sm font-semibold text-slate-700">{copy.content}<textarea name="content" required minLength={10} maxLength={5000} rows={6} dir="auto" className="mt-2 min-w-0 w-full max-w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-normal leading-relaxed outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /></label>
      <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="flex min-w-0 items-start gap-3 text-sm leading-relaxed text-slate-600"><input type="checkbox" name="consent" required className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary" /><span className="min-w-0 break-words">{copy.consent}</span></label>
      <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-primary px-5 font-bold text-white transition hover:bg-primary-800 disabled:opacity-60">{loading ? copy.submitting : copy.submit}</button>
    </form>
  );
}
