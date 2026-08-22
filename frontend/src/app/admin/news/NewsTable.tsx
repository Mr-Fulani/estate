'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, ExternalLink, Languages, Search, Trash2 } from 'lucide-react';

import { deleteNewsArticle } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { NewsAdminArticle } from '@/types';
import { locales as supportedLocales } from '@/i18n/config';
import { AdminActionSpinner } from '@/components/admin/AdminActionSpinner';

function articleTitle(article: NewsAdminArticle): string {
  return article.translations.find((item) => item.locale === 'ru')?.title || article.slug;
}

export function NewsTable({ initialArticles }: { initialArticles: NewsAdminArticle[] }) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('ru');
    if (!needle) return articles;
    return articles.filter((article) =>
      article.slug.toLowerCase().includes(needle)
      || article.translations.some((item) => item.title.toLocaleLowerCase(item.locale).includes(needle)),
    );
  }, [articles, search]);

  const handleDelete = async (article: NewsAdminArticle) => {
    if (!window.confirm(`Удалить публикацию «${articleTitle(article)}»? Это действие нельзя отменить.`)) return;
    setDeletingId(article.id);
    try {
      await deleteNewsArticle(article.id);
      setArticles((items) => items.filter((item) => item.id !== article.id));
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось удалить публикацию');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Поиск публикаций</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или slug…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
        </label>
        <span className="text-sm font-medium text-slate-500">Публикаций: <b className="text-slate-900">{filtered.length}</b></span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">Публикации не найдены</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((article) => {
            const title = articleTitle(article);
            const locales = article.translations.map((item) => item.locale);
            return (
              <article key={article.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/20 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${article.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{article.is_published ? 'Опубликовано' : 'Черновик'}</span>
                    {article.published_at && <time className="text-xs text-slate-500" dateTime={article.published_at}>{formatDate(article.published_at, 'ru')}</time>}
                  </div>
                  <h2 className="truncate text-lg font-bold text-slate-900">{title}</h2>
                  <p className="mt-1 truncate text-xs text-slate-400">/{article.slug}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Languages className="h-4 w-4 text-primary" aria-hidden="true" />
                    {supportedLocales.map((locale) => <span key={locale} className={`rounded-md border px-2 py-0.5 uppercase ${locales.includes(locale) ? 'border-primary/20 bg-primary/5 text-primary' : 'border-slate-200 text-slate-300'}`}>{locale}</span>)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                  {article.is_published && <Link href={`/ru/news/${article.slug}`} target="_blank" className="rounded-lg p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-primary" title="Открыть на сайте"><ExternalLink className="h-4 w-4" /></Link>}
                  <Link href={`/admin/news/${article.id}/edit`} className="rounded-lg p-2.5 text-slate-600 transition hover:bg-primary/5 hover:text-primary" title="Редактировать"><Edit3 className="h-4 w-4" /></Link>
                  <button type="button" onClick={() => handleDelete(article)} disabled={deletingId === article.id} aria-busy={deletingId === article.id} className="rounded-lg p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40" title="Удалить">{deletingId === article.id ? <AdminActionSpinner /> : <Trash2 className="h-4 w-4" />}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
