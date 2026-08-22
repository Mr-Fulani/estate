'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronDown, ExternalLink, Search, Star, Trash2 } from 'lucide-react';

import { deleteAdminReview, updateAdminReview } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AdminReview, ReviewTranslation } from '@/types';
import { locales, type Locale } from '@/i18n/config';

const statusLabels = { invited: 'Приглашение', pending: 'На модерации', published: 'Опубликован', rejected: 'Отклонён' } as const;
const statusColors = { invited: 'bg-blue-100 text-blue-800', pending: 'bg-amber-100 text-amber-800', published: 'bg-emerald-100 text-emerald-800', rejected: 'bg-slate-200 text-slate-700' } as const;


function ReviewEditor({ review, onUpdated, onDeleted }: { review: AdminReview; onUpdated: (review: AdminReview) => void; onDeleted: (id: number) => void }) {
  const [form, setForm] = useState(review);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setForm(review), [review]);

  const translations: ReviewTranslation[] = locales.map((locale) => form.translations.find((item) => item.locale === locale) || { locale, content: '', reviewer_role: '', company_response: '' });
  const updateTranslation = (locale: Locale, field: 'content' | 'reviewer_role' | 'company_response', value: string) => {
    setForm((current) => ({ ...current, translations: translations.map((item) => item.locale === locale ? { ...item, [field]: value } : item) }));
  };
  const save = async () => {
    setLoading(true); setError('');
    try {
      const updated = await updateAdminReview(form.id, {
        reviewer_name: form.reviewer_name,
        rating: form.rating,
        status: form.status,
        is_verified: form.is_verified,
        is_featured: form.is_featured,
        display_order: form.display_order,
        property_id: form.property_id,
        translations: translations.filter((item) => item.content.trim()).map((item) => ({ ...item, content: item.content.trim(), reviewer_role: item.reviewer_role?.trim() || null, company_response: item.company_response?.trim() || null })),
      });
      onUpdated(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить отзыв');
    } finally { setLoading(false); }
  };
  const remove = async () => {
    if (!confirm('Удалить отзыв без возможности восстановления?')) return;
    setLoading(true);
    try { await deleteAdminReview(form.id); onDeleted(form.id); } finally { setLoading(false); }
  };
  return (
    <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:content-none sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{form.reviewer_name || 'Приглашённый клиент'}</h3><span className={cn('rounded-full px-2 py-1 text-[10px] font-bold', statusColors[form.status])}>{statusLabels[form.status]}</span>{form.is_verified && <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><BadgeCheck className="h-4 w-4" />Сделка подтверждена</span>}</div>
          <p className="mt-1 truncate text-sm text-slate-500">{form.property?.title || 'Без привязки к объекту'} · {new Date(form.created_at).toLocaleDateString('ru-RU')}</p>
        </div>
        <div className="flex items-center gap-3"><div className="flex">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= (form.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div><ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" /></div>
      </summary>
      <div className="space-y-6 border-t border-slate-100 bg-slate-50/60 p-5">
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Имя<input value={form.reviewer_name || ''} onChange={(event) => setForm((current) => ({ ...current, reviewer_name: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal outline-none focus:border-primary" /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Оценка<select value={form.rating || 5} onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal"><option value="5">5 — отлично</option><option value="4">4 — хорошо</option><option value="3">3 — нормально</option><option value="2">2 — плохо</option><option value="1">1 — очень плохо</option></select></label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Статус<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminReview['status'] }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Порядок<input type="number" min="0" value={form.display_order} onChange={(event) => setForm((current) => ({ ...current, display_order: Number(event.target.value) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal" /></label>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><input type="checkbox" checked={form.is_verified} onChange={(event) => setForm((current) => ({ ...current, is_verified: event.target.checked }))} />Подтверждённый клиент</label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm((current) => ({ ...current, is_featured: event.target.checked }))} />Показывать на главной</label>
          {form.property && <a href={`/ru/properties/${form.property.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-primary"><ExternalLink className="h-4 w-4" />Открыть объект</a>}
          {form.has_active_invitation && <span className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">Активная ссылка-приглашение</span>}
        </div>
        <p className="text-xs text-slate-500">Контакт для проверки: {form.phone || form.email || 'не указан'}. Публично не показывается.</p>
        <div className="grid gap-5 xl:grid-cols-2">
          {translations.map((translation) => <fieldset key={translation.locale} dir={translation.locale === 'ar' ? 'rtl' : 'ltr'} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><legend className="px-2 text-sm font-bold text-primary">{translation.locale.toUpperCase()}</legend><label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Роль<input value={translation.reviewer_role || ''} onChange={(event) => updateTranslation(translation.locale, 'reviewer_role', event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary" /></label><label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Отзыв<textarea rows={6} value={translation.content} onChange={(event) => updateTranslation(translation.locale, 'content', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal leading-relaxed normal-case tracking-normal outline-none focus:border-primary" /></label><label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Ответ Estate<textarea rows={3} value={translation.company_response || ''} onChange={(event) => updateTranslation(translation.locale, 'company_response', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal leading-relaxed normal-case tracking-normal outline-none focus:border-primary" /></label></fieldset>)}
        </div>
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row"><button type="button" onClick={() => void remove()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Удалить</button><button type="button" onClick={() => void save()} disabled={loading} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-800 disabled:opacity-50">{loading ? 'Сохранение…' : 'Сохранить отзыв'}</button></div>
      </div>
    </details>
  );
}


export function ReviewsManager({ initialReviews }: { initialReviews: AdminReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [status, setStatus] = useState<'all' | AdminReview['status']>('all');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => reviews.filter((review) => (status === 'all' || review.status === status) && (!search.trim() || [review.reviewer_name, review.email, review.phone, review.property?.title].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase()))), [reviews, search, status]);
  return <div className="space-y-4"><div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Клиент, контакт или объект…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-primary" /></div><div className="flex flex-wrap gap-2">{(['all', 'invited', 'pending', 'published', 'rejected'] as const).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={cn('rounded-xl px-3 py-2 text-xs font-bold', status === value ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600')}>{value === 'all' ? `Все (${reviews.length})` : `${statusLabels[value]} (${reviews.filter((item) => item.status === value).length})`}</button>)}</div></div>{filtered.length ? <div className="space-y-3">{filtered.map((review) => <ReviewEditor key={review.id} review={review} onUpdated={(updated) => setReviews((current) => current.map((item) => item.id === updated.id ? updated : item))} onDeleted={(id) => setReviews((current) => current.filter((item) => item.id !== id))} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center text-slate-500">Отзывов не найдено.</div>}</div>;
}
