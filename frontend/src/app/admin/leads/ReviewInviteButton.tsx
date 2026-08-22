'use client';

import { useState } from 'react';
import { Copy, Star } from 'lucide-react';

import type { Locale } from '@/i18n/config';
import { isLocale } from '@/i18n/config';
import { createReviewInvitation } from '@/lib/api';


export function ReviewInviteButton({ contactId, initialLocale }: { contactId: number; initialLocale?: string | null }) {
  const [locale, setLocale] = useState<Locale>(initialLocale && isLocale(initialLocale) ? initialLocale : 'ru');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const create = async () => {
    setLoading(true); setError('');
    try {
      const invitation = await createReviewInvitation(contactId, locale);
      const invitationUrl = `${window.location.origin}/${locale}/reviews?token=${encodeURIComponent(invitation.token)}`;
      setUrl(invitationUrl);
      await navigator.clipboard.writeText(invitationUrl).catch(() => undefined);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Не удалось создать ссылку');
    } finally { setLoading(false); }
  };

  return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex flex-1 items-center gap-2"><Star className="h-5 w-5 text-amber-600" /><div><p className="text-sm font-bold text-amber-950">Запросить подтверждённый отзыв</p><p className="text-xs text-amber-800">Персональная ссылка действует 30 дней.</p></div></div><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="h-10 rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold"><option value="ru">RU</option><option value="en">EN</option><option value="tr">TR</option></select><button type="button" onClick={() => void create()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"><Copy className="h-4 w-4" />{loading ? 'Создание…' : url ? 'Создать новую ссылку' : 'Создать и скопировать'}</button></div>{url && <div className="mt-3 flex gap-2"><input readOnly value={url} className="h-10 min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-xs" /><button type="button" onClick={() => void navigator.clipboard.writeText(url)} className="rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold text-amber-800">Копировать</button></div>}{error && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}</div>;
}
