'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Image as ImageIcon, Languages, Play, Plus, Save, Star, Trash2, Upload, Youtube } from 'lucide-react';

import { createNewsArticle, updateNewsArticle, uploadNewsImage } from '@/lib/api';
import { startNavigationFeedback } from '@/components/layout/NavigationFeedback';
import { cn } from '@/lib/utils';
import { getYouTubeThumbnail, getYouTubeVideoId } from '@/lib/youtube';
import type { NewsAdminArticle, NewsFormData, NewsMediaType, NewsTranslation } from '@/types';
import { localeLabels, locales, type Locale } from '@/i18n/config';

const newsLocales = locales;
type NewsLocale = Locale;

function emptyTranslation(locale: NewsLocale): NewsTranslation {
  return { locale, title: '', excerpt: '', content: '', meta_title: '', meta_description: '' };
}

export function NewsForm({ initialData }: { initialData?: NewsAdminArticle }) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<NewsLocale>('ru');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [newMediaType, setNewMediaType] = useState<NewsMediaType>('image');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [formData, setFormData] = useState<NewsFormData>({
    slug: initialData?.slug || '',
    cover_image: initialData?.cover_image || '',
    author: initialData?.author || 'Rahat Home',
    is_published: initialData?.is_published ?? false,
    published_at: initialData?.published_at ? initialData.published_at.slice(0, 16) : '',
    translations: newsLocales.map((locale) => initialData?.translations.find((item) => item.locale === locale) || emptyTranslation(locale)),
    media: [...(initialData?.media || [])].sort((first, second) => first.position - second.position),
  });

  const translation = useMemo(
    () => formData.translations.find((item) => item.locale === activeLocale) || emptyTranslation(activeLocale),
    [activeLocale, formData.translations],
  );

  const setTranslation = (locale: NewsLocale, field: keyof Omit<NewsTranslation, 'id' | 'locale'>, value: string) => {
    setFormData((current) => ({
      ...current,
      translations: current.translations.map((item) => item.locale === locale ? { ...item, [field]: value } : item),
    }));
  };

  const isComplete = (locale: NewsLocale) => {
    const item = formData.translations.find((entry) => entry.locale === locale);
    return Boolean(item?.title.trim() && item.excerpt.trim() && item.content.trim());
  };

  const handleAddMedia = () => {
    const url = newMediaUrl.trim();
    setMediaError(null);
    if (!url) {
      setMediaError('Вставьте ссылку на изображение или YouTube-видео.');
      return;
    }
    if (newMediaType === 'image') {
      const isLocal = url.startsWith('/') && !url.startsWith('//');
      let isRemote = false;
      try {
        isRemote = ['http:', 'https:'].includes(new URL(url).protocol);
      } catch {
        isRemote = false;
      }
      if (!isLocal && !isRemote) {
        setMediaError('Для изображения укажите прямую ссылку https://… или путь /news/…');
        return;
      }
    } else if (!getYouTubeVideoId(url)) {
      setMediaError('Не удалось распознать YouTube-ссылку. Поддерживаются watch, youtu.be, shorts и live.');
      return;
    }
    if (formData.media.some((item) => item.media_type === newMediaType && item.url === url)) {
      setMediaError('Этот медиафайл уже добавлен.');
      return;
    }
    if (formData.media.length >= 50) {
      setMediaError('К одной статье можно добавить не более 50 медиаэлементов.');
      return;
    }

    setFormData((current) => ({
      ...current,
      media: [...current.media, { media_type: newMediaType, url, position: current.media.length }],
    }));
    setNewMediaUrl('');
  };

  const handleUploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    setMediaError(null);
    const availableSlots = Math.max(0, 50 - formData.media.length);
    if (!availableSlots) {
      setMediaError('К одной статье можно добавить не более 50 медиаэлементов.');
      input.value = '';
      return;
    }
    const selectedFiles = files.slice(0, availableSlots);
    if (selectedFiles.length < files.length) setMediaError(`Будут загружены первые ${availableSlots} файлов из-за лимита.`);

    setUploadingMedia(true);
    try {
      for (const file of selectedFiles) {
        const url = await uploadNewsImage(file);
        setFormData((current) => ({
          ...current,
          cover_image: current.cover_image || url,
          media: [...current.media, { media_type: 'image', url, position: current.media.length }],
        }));
      }
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить изображение.');
    } finally {
      setUploadingMedia(false);
      input.value = '';
    }
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= formData.media.length) return;
    setFormData((current) => {
      const media = [...current.media];
      [media[index], media[nextIndex]] = [media[nextIndex], media[index]];
      return { ...current, media: media.map((item, position) => ({ ...item, position })) };
    });
  };

  const removeMedia = (index: number) => {
    setFormData((current) => ({
      ...current,
      media: current.media
        .filter((_, mediaIndex) => mediaIndex !== index)
        .map((item, position) => ({ ...item, position })),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const russian = formData.translations.find((item) => item.locale === 'ru');
    if (!russian?.title.trim() || !russian.excerpt.trim() || !russian.content.trim()) {
      setActiveLocale('ru');
      setError('Заполните заголовок, анонс и текст на русском языке.');
      return;
    }

    const partialTranslation = formData.translations.find((item) => {
      const hasAnyContent = Boolean(item.title.trim() || item.excerpt.trim() || item.content.trim() || item.meta_title?.trim() || item.meta_description?.trim());
      return item.locale !== 'ru' && hasAnyContent && !isComplete(item.locale);
    });
    if (partialTranslation) {
      setActiveLocale(partialTranslation.locale);
      setError(`Перевод ${localeLabels[partialTranslation.locale]} заполнен частично. Добавьте заголовок, анонс и текст или очистите вкладку.`);
      return;
    }
    const translations = formData.translations.filter((item) => item.locale === 'ru' || Boolean(item.title.trim() || item.excerpt.trim() || item.content.trim()));

    const payload: NewsFormData = {
      slug: formData.slug?.trim() || undefined,
      cover_image: formData.cover_image?.trim() || null,
      author: formData.author.trim() || 'Rahat Home',
      is_published: formData.is_published,
      published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null,
      translations: translations.map((item) => ({
        locale: item.locale,
        title: item.title.trim(),
        excerpt: item.excerpt.trim(),
        content: item.content.trim(),
        meta_title: item.meta_title?.trim() || null,
        meta_description: item.meta_description?.trim() || null,
      })),
      media: formData.media.map((item, position) => ({
        media_type: item.media_type,
        url: item.url.trim(),
        position,
      })),
    };

    setLoading(true);
    try {
      if (initialData) await updateNewsArticle(initialData.id, payload);
      else await createNewsArticle(payload);
      startNavigationFeedback();
      router.push('/admin/news');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить публикацию');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-6">
      <Link href="/admin/news" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary"><ArrowLeft className="h-4 w-4" />К списку новостей</Link>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.4fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:p-8">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4"><Languages className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold text-slate-900">Текст и переводы</h2></div>
          <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Язык публикации">
            {newsLocales.map((locale) => (
              <button key={locale} type="button" role="tab" aria-selected={activeLocale === locale} onClick={() => setActiveLocale(locale)} className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition', activeLocale === locale ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40')}>
                {localeLabels[locale]}
                {isComplete(locale) && <Check className={cn('h-4 w-4', activeLocale === locale ? 'text-secondary' : 'text-emerald-600')} aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div role="tabpanel" dir={activeLocale === 'ar' ? 'rtl' : 'ltr'} className="space-y-5">
            <div><label htmlFor={`news-title-${activeLocale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Заголовок {activeLocale === 'ru' && '*'}</label><input id={`news-title-${activeLocale}`} required={activeLocale === 'ru'} value={translation.title} onChange={(event) => setTranslation(activeLocale, 'title', event.target.value)} maxLength={240} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /></div>
            <div><label htmlFor={`news-excerpt-${activeLocale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Краткий анонс {activeLocale === 'ru' && '*'}</label><textarea id={`news-excerpt-${activeLocale}`} required={activeLocale === 'ru'} rows={3} value={translation.excerpt} onChange={(event) => setTranslation(activeLocale, 'excerpt', event.target.value)} maxLength={500} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /><p className="mt-1 text-right text-xs text-slate-400">{translation.excerpt.length}/500</p></div>
            <div><label htmlFor={`news-content-${activeLocale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Текст статьи {activeLocale === 'ru' && '*'}</label><textarea id={`news-content-${activeLocale}`} required={activeLocale === 'ru'} rows={16} value={translation.content} onChange={(event) => setTranslation(activeLocale, 'content', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /><p className="mt-1 text-xs text-slate-400">Разделяйте абзацы пустой строкой.</p></div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div><label htmlFor={`news-meta-title-${activeLocale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">SEO-заголовок</label><input id={`news-meta-title-${activeLocale}`} value={translation.meta_title || ''} onChange={(event) => setTranslation(activeLocale, 'meta_title', event.target.value)} maxLength={240} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-primary focus:bg-white" /></div>
              <div><label htmlFor={`news-meta-description-${activeLocale}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">SEO-описание</label><textarea id={`news-meta-description-${activeLocale}`} value={translation.meta_description || ''} onChange={(event) => setTranslation(activeLocale, 'meta_description', event.target.value)} maxLength={320} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-primary focus:bg-white" /></div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:sticky xl:top-6">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4"><ImageIcon className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold text-slate-900">Публикация и обложка</h2></div>
          <div className="grid gap-5">
            <div><label htmlFor="news-slug" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Slug</label><input id="news-slug" value={formData.slug || ''} onChange={(event) => setFormData((data) => ({ ...data, slug: event.target.value }))} placeholder="sozdaetsya-avtomaticheski" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-primary focus:bg-white" /></div>
            <div><label htmlFor="news-author" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Автор *</label><input id="news-author" required value={formData.author} onChange={(event) => setFormData((data) => ({ ...data, author: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-primary focus:bg-white" /></div>
            <div><label htmlFor="news-cover" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">URL обложки</label><input id="news-cover" type="text" value={formData.cover_image || ''} onChange={(event) => setFormData((data) => ({ ...data, cover_image: event.target.value }))} placeholder="https://… или /news/…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-primary focus:bg-white" />{formData.cover_image && <div className="mt-4 aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100"><img src={formData.cover_image} alt="Предпросмотр обложки" className="h-full w-full object-cover" /></div>}</div>
            <div><label htmlFor="news-published-at" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Дата публикации</label><input id="news-published-at" type="datetime-local" value={formData.published_at || ''} onChange={(event) => setFormData((data) => ({ ...data, published_at: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-primary focus:bg-white" /></div>
            <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><input type="checkbox" checked={formData.is_published} onChange={(event) => setFormData((data) => ({ ...data, is_published: event.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary" /><span><b className="block text-sm text-slate-900">Опубликовать</b><span className="text-xs text-slate-500">Статья станет доступна на сайте</span></span></label>
          </div>
        </section>
      </div>

      <section id="news-media" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:p-8">
        <div className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold text-slate-900">Медиа статьи</h2></div>
            <p className="mt-1 text-sm text-slate-500">Добавляйте несколько изображений и YouTube-видео, затем задайте порядок показа.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{formData.media.length}/50</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label="Тип медиа">
            <button type="button" onClick={() => { setNewMediaType('image'); setMediaError(null); }} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition', newMediaType === 'image' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900')}><ImageIcon className="h-4 w-4" />Фото</button>
            <button type="button" onClick={() => { setNewMediaType('youtube'); setMediaError(null); }} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition', newMediaType === 'youtube' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900')}><Youtube className="h-4 w-4" />YouTube</button>
          </div>
          <input
            type="text"
            value={newMediaUrl}
            onChange={(event) => setNewMediaUrl(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleAddMedia(); } }}
            placeholder={newMediaType === 'image' ? 'Прямая ссылка на изображение или /news/…' : 'https://www.youtube.com/watch?v=…'}
            aria-label={newMediaType === 'image' ? 'Ссылка на изображение' : 'Ссылка на YouTube-видео'}
            className="h-12 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
          <button type="button" onClick={handleAddMedia} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-800"><Plus className="h-4 w-4" />Добавить</button>
        </div>
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Загрузить изображения с компьютера</p>
            <p className="mt-0.5 text-xs text-slate-500">JPEG, PNG, WebP или GIF, до 12 МБ каждый. Можно выбрать несколько файлов.</p>
          </div>
          <label className={cn('inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-primary shadow-sm transition hover:border-primary', uploadingMedia && 'pointer-events-none opacity-60')}>
            <Upload className="h-4 w-4" />{uploadingMedia ? 'Загрузка…' : 'Выбрать файлы'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleUploadImages} disabled={uploadingMedia} className="sr-only" />
          </label>
        </div>
        {mediaError && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{mediaError}</p>}

        {formData.media.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {formData.media.map((item, index) => {
              const youtubeThumbnail = item.media_type === 'youtube' ? getYouTubeThumbnail(item.url) : null;
              return (
                <article key={`${item.media_type}-${item.url}-${index}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                  <div className="relative aspect-video overflow-hidden bg-slate-900">
                    {item.media_type === 'image' ? (
                      <img src={item.url} alt={`Изображение ${index + 1}`} className="h-full w-full object-cover" />
                    ) : youtubeThumbnail ? (
                      <><img src={youtubeThumbnail} alt={`YouTube-видео ${index + 1}`} className="h-full w-full object-cover opacity-85" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg"><Play className="ml-0.5 h-5 w-5 fill-current" /></span></span></>
                    ) : (
                      <span className="flex h-full items-center justify-center text-white"><Youtube className="h-10 w-10" /></span>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">{index + 1} · {item.media_type === 'image' ? 'Фото' : 'YouTube'}</span>
                  </div>
                  <div className="space-y-3 bg-white p-3">
                    <p className="truncate text-xs text-slate-500" title={item.url}>{item.url}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveMedia(index, -1)} disabled={index === 0} aria-label="Переместить выше" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                        <button type="button" onClick={() => moveMedia(index, 1)} disabled={index === formData.media.length - 1} aria-label="Переместить ниже" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                        {item.media_type === 'image' && formData.cover_image !== item.url && <button type="button" onClick={() => setFormData((current) => ({ ...current, cover_image: item.url }))} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-secondary-50 hover:text-secondary-700"><Star className="h-3.5 w-3.5" />На обложку</button>}
                        {item.media_type === 'image' && formData.cover_image === item.url && <span className="inline-flex items-center gap-1 px-2 text-xs font-bold text-secondary-700"><Star className="h-3.5 w-3.5 fill-current" />Обложка</span>}
                      </div>
                      <button type="button" onClick={() => removeMedia(index)} aria-label="Удалить медиа" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">Медиа ещё не добавлены. Обложка статьи может использоваться отдельно.</div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/admin/news" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-100">Отмена</Link><button type="submit" disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-white shadow-md transition hover:bg-primary-800 disabled:opacity-50"><Save className="h-4 w-4" />{loading ? 'Сохранение…' : initialData ? 'Сохранить изменения' : 'Создать публикацию'}</button></div>
    </form>
  );
}
