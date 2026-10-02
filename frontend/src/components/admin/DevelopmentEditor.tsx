'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Upload, Film, Link2, ExternalLink } from 'lucide-react';
import { uploadPropertyImage, uploadPropertyVideo } from '@/lib/api';
import type { DevelopmentCopy, DevelopmentProfile, PropertyUnitType, PropertyPlanDetail } from '@/types';
import { locales, localeLabels, type Locale } from '@/i18n/config';

import { isMediaUrl, developmentVideoSections } from '@/lib/development-view';
import { displayImageUrl, isDirectVideoUrl, videoEmbedUrl } from '@/lib/video-media';
const emptyCopy: DevelopmentCopy = { eyebrow: '', headline: '', story_title: '', story: '', location_description: '', purchase_note: '', amenities: [] };
const control = 'mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900';

export function PropertyImageUpload({ onUploaded, onBusy, multiple = true, kind = 'photo', label = 'Загрузить изображения' }: { onUploaded: (urls: string[]) => void; onBusy?: (busy: boolean) => void; multiple?: boolean; kind?: 'photo' | 'plan'; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-primary"><Upload size={15} />{busy ? 'Загрузка…' : label}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={multiple} disabled={busy} className="sr-only" onChange={async event => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setBusy(true); onBusy?.(true); setError('');
    const urls: string[] = [];
    try { for (const file of files) urls.push(await uploadPropertyImage(file, kind)); }
    catch (error) { setError(error instanceof Error ? error.message : 'Ошибка загрузки'); }
    finally { if (urls.length) onUploaded(urls); setBusy(false); onBusy?.(false); }
  }} /></label>{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}

export function PropertyVideoUpload({ onUploaded, onBusy, multiple = true, label = 'Загрузить видео' }: { onUploaded: (urls: string[]) => void; onBusy?: (busy: boolean) => void; multiple?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-primary"><Upload size={15} />{busy ? 'Загрузка видео…' : label}<input type="file" accept="video/mp4,video/quicktime,video/webm,video/ogg,.mp4,.mov,.webm,.ogv" multiple={multiple} disabled={busy} className="sr-only" onChange={async event => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setBusy(true); onBusy?.(true); setError('');
    const urls: string[] = [];
    try { for (const file of files) urls.push(await uploadPropertyVideo(file)); }
    catch (error) { setError(error instanceof Error ? error.message : 'Ошибка загрузки видео'); }
    finally { if (urls.length) onUploaded(urls); setBusy(false); onBusy?.(false); }
  }} /></label><span className="ml-3 text-xs text-slate-500">MP4, MOV, WebM · до 250 МБ</span>{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}

export function DevelopmentEditor({ profile, units, projectImages, projectVideos = [], onProfile, onUnits, onProjectImages, onBusy }: { profile: DevelopmentProfile; units: PropertyUnitType[]; projectImages: string[]; projectVideos?: string[]; onProfile: (value: DevelopmentProfile) => void; onUnits: (value: PropertyUnitType[]) => void; onProjectImages: (urls: string[]) => void; onBusy: (busy: boolean) => void }) {
  const [locale, setLocale] = useState<Locale>('ru');
  const copy = { ...emptyCopy, ...profile.translations[locale] };
  const patchProfile = (value: Partial<DevelopmentProfile>) => onProfile({ ...profile, ...value });
  const patchCopy = (value: Partial<DevelopmentCopy>) => patchProfile({ translations: { ...profile.translations, [locale]: { ...copy, ...value } } });
  const patchUnit = (index: number, value: Partial<PropertyUnitType>) => onUnits(units.map((unit, i) => i === index ? { ...unit, ...value } : unit));
  const patchPlan = (unitIndex: number, image: string, planIndex: number, values: Partial<PropertyPlanDetail>) => {
    const details = units[unitIndex].plan_details || [];
    const current = details.find(detail => detail.image === image) || { image, code: `Планировка ${planIndex + 1}`, area_gross: null, area_net: null, area_with_balcony: null };
    patchUnit(unitIndex, { plan_details: [...details.filter(detail => detail.image !== image), { ...current, ...values }] });
  };
  return <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
    <div><h2 className="text-lg font-bold">Жилой комплекс и резиденции</h2><p className="mt-2 text-sm text-slate-500">В каталоге показывается одна карточка. Цена и площадь «от» рассчитываются из вариантов ниже. Валюта общая для всего комплекса. Если цена или площадь неизвестна, оставьте обе границы пустыми: на сайте будет «по запросу». Для комплекса нужен хотя бы один вариант с ценой.</p></div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm md:col-span-2"><input type="checkbox" checked={!!profile.is_demo} onChange={event => patchProfile({ is_demo: event.target.checked })} /><span>Демонстрационный комплекс — видимая пометка DEMO, без заявок, индексации и рекомендаций на главной. Используйте только для тестовых данных.</span></label>
      <label className="text-sm">Девелопер<input className={control} value={profile.developer} maxLength={100} onChange={event => patchProfile({ developer: event.target.value })} /></label>
      <label className="text-sm">Бренд дизайна<input className={control} value={profile.design_brand} maxLength={100} onChange={event => patchProfile({ design_brand: event.target.value })} /></label>
      <label className="text-sm">Дата обновления файла / подтверждения<input type="date" className={control} value={profile.price_date || ''} required={profile.price_status === 'verified'} onChange={event => patchProfile({ price_date: event.target.value || null })} /></label>
      <label className="text-sm">Актуальность цен<select className={control} value={profile.price_status} onChange={event => patchProfile({ price_status: event.target.value as DevelopmentProfile['price_status'] })}><option value="indicative">Ориентир из исходного прайса</option><option value="verified">Проверены у продавца</option></select></label>
      <label className="text-sm md:col-span-2">Ссылка на презентацию<input className={control} value={profile.brochure_url || ''} placeholder="/residences/project/brochure.pdf или https://…" onChange={event => patchProfile({ brochure_url: event.target.value || null })} /></label>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={profile.images_are_renders} onChange={event => patchProfile({ images_are_renders: event.target.checked })} />Изображения являются архитектурными визуализациями</label>
    </div>
    <div id="property-media" className="scroll-mt-28 space-y-5 border-t border-slate-100 pt-5"><div><h3 className="font-semibold">Медиа жилого комплекса</h3><p className="mt-1 text-sm text-slate-500">Сюда добавляйте общие фото и видео проекта: территорию, инфраструктуру, расположение и обзор комплекса. Фотографии показываются в шапке. Все видео доступны в нижней галерее; для каждого ролика можно отдельно включить показ в шапке. Материалы конкретного типа виллы добавляйте в карточку этого типа ниже.</p></div><div><p className="mb-2 text-sm font-medium">Фотографии комплекса</p><ImageOrder urls={projectImages} onChange={onProjectImages} label="Фото комплекса" /><div className="mt-3"><PropertyImageUpload onBusy={onBusy} onUploaded={urls => onProjectImages([...projectImages, ...urls])} label="Загрузить фото комплекса" /></div></div><div><p className="mb-2 text-sm font-medium">Видео комплекса</p><VideoOrder urls={developmentVideoSections(profile, projectVideos).gallery} hiddenHeroVideos={profile.hidden_hero_videos || []} onHeroVisibility={(url, visible) => patchProfile({ hidden_hero_videos: visible ? (profile.hidden_hero_videos || []).filter(value => value !== url) : Array.from(new Set([...(profile.hidden_hero_videos || []), url])) })} onChange={urls => patchProfile({ hero_videos: urls, hero_video_url: urls[0] || null })} label="Видео проекта" /><div className="mt-3 flex flex-wrap gap-3"><PropertyVideoUpload onBusy={onBusy} onUploaded={urls => { const hero_videos = [...(profile.hero_videos || (profile.hero_video_url ? [profile.hero_video_url] : [])), ...urls]; patchProfile({ hero_videos, hero_video_url: hero_videos[0] || null }); }} /><AddVideoLink onAdd={url => { const hero_videos = [...(profile.hero_videos || (profile.hero_video_url ? [profile.hero_video_url] : [])), url]; patchProfile({ hero_videos, hero_video_url: hero_videos[0] || null }); }} /></div></div></div>
    <div className="border-t border-slate-100 pt-5"><h3 className="mb-3 font-semibold">Тексты страницы комплекса</h3><div className="mb-4 flex flex-wrap gap-2">{locales.map(value => <button type="button" key={value} aria-pressed={locale === value} onClick={() => setLocale(value)} className={`rounded-lg border px-3 py-2 text-sm ${locale === value ? 'bg-primary text-white' : ''}`}>{localeLabels[value]}</button>)}</div>
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="grid gap-4 md:grid-cols-2">
        {([['eyebrow', 'Подзаголовок над названием'], ['headline', 'Фраза на первом экране'], ['story_title', 'Заголовок «О проекте»'], ['story', 'История интерьеров'], ['location_description', 'Описание расположения'], ['purchase_note', 'Условия покупки / примечание']] as const).map(([field, label]) => <label key={field} className="text-sm">{label}<textarea className={control} rows={field === 'story' || field === 'location_description' ? 4 : 2} value={copy[field]} onChange={event => patchCopy({ [field]: event.target.value })} /></label>)}
        <label className="text-sm md:col-span-2">Инфраструктура — один пункт в строке<textarea className={control} rows={4} value={copy.amenities.join('\n')} onChange={event => patchCopy({ amenities: event.target.value.split('\n') })} /></label>
      </div>
    </div>
    <div className="border-t border-slate-100 pt-5"><h3 className="mb-2 font-semibold">Дополнительная галерея проекта</h3><p className="mb-3 text-xs text-slate-500">Эти изображения идут в отдельную галерею ниже шапки. Если источник не связывает фото с планировкой, храните его здесь как фото примерной виллы.</p><ImageOrder urls={profile.interior_images} onChange={interior_images => patchProfile({ interior_images })} label="Фото примерной виллы / интерьеров" /><div className="mt-3"><PropertyImageUpload onBusy={onBusy} onUploaded={urls => patchProfile({ interior_images: [...profile.interior_images.filter(Boolean), ...urls] })} label="Загрузить фото для галереи проекта" /></div></div>
    <div className="border-t border-slate-100 pt-5"><h3 className="mb-4 font-semibold">Варианты квартир</h3><div className="space-y-5">{units.map((unit, index) => <fieldset key={unit.id ?? index} className="rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold">Вариант {index + 1}</legend><div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <label className="text-xs">Название (например 1+1)<input required maxLength={40} className={control} value={unit.code} onChange={event => patchUnit(index, { code: event.target.value })} /></label>
      <label className="text-xs">Спальни (для фильтра)<input required min={1} max={50} type="number" className={control} value={unit.rooms || ''} onChange={event => patchUnit(index, { rooms: Number(event.target.value) })} /></label>
      {([['area_min', 'Площадь от, м²'], ['area_max', 'Площадь до, м²'], ['price_min', 'Цена от'], ['price_max', 'Цена до']] as const).map(([field, label]) => <label className="text-xs" key={field}>{label}<input min={0.01} step="0.01" type="number" placeholder="По запросу" className={control} value={unit[field] ?? ''} onChange={event => patchUnit(index, { [field]: event.target.value === '' ? null : Number(event.target.value) })} /></label>)}
      <div className="col-span-2 text-xs md:col-span-3"><p className="mb-2 font-medium">Планы этого типа</p><ImageOrder urls={unit.plans} onChange={plans => patchUnit(index, { plans })} label="План" /><PropertyImageUpload onBusy={onBusy} onUploaded={urls => patchUnit(index, { plans: [...unit.plans.filter(Boolean), ...urls] })} kind="plan" label="Загрузить планы" /></div>
    </div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => onUnits(units.filter((_, i) => i !== index))} className="flex items-center gap-2 text-xs text-red-600"><Trash2 size={14} />Убрать вариант</button></div>
      <div className="mt-5 border-t border-slate-100 pt-4"><h4 className="font-semibold">Медиа виллы {unit.code || ''}</h4><p className="mt-1 text-xs text-slate-500">Для карточки {unit.code || 'этого типа'} добавляйте только относящиеся к нему фото и видео. Общие ролики о комплексе, территории, инфраструктуре и локации добавляйте выше — в «Медиа жилого комплекса».</p><ImageOrder urls={unit.media_images || []} onChange={media_images => patchUnit(index, { media_images })} label="Фото виллы" /><div className="mt-3"><PropertyImageUpload onBusy={onBusy} onUploaded={urls => patchUnit(index, { media_images: [...(unit.media_images || []).filter(Boolean), ...urls] })} label="Загрузить фото виллы" /></div><VideoOrder urls={unit.video_url ? [unit.video_url] : []} onChange={urls => patchUnit(index, { video_url: urls[0] || null })} label={`Видео ${unit.code}`} /><div className="mt-3 flex flex-wrap gap-3"><PropertyVideoUpload onBusy={onBusy} multiple={false} label="Загрузить видео виллы" onUploaded={urls => patchUnit(index, { video_url: urls[0] || null })} /><AddVideoLink onAdd={url => patchUnit(index, { video_url: url })} /></div></div>
      {unit.plans.map((value, planIndex) => {
        const image = value.trim();
        if (!image) return null;
        const detail = unit.plan_details?.find(item => item.image === image);
        return <details key={`${image}-${planIndex}`} className="mt-4 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm">Параметры плана {planIndex + 1}{detail?.code ? ` · ${detail.code}` : ''}</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-xs">Код / название плана<input className={control} value={detail?.code || ''} maxLength={60} onChange={event => patchPlan(index, image, planIndex, { code: event.target.value })} /></label>{([['area_gross', 'Общая площадь (gross), м²'], ['area_net', 'Полезная площадь (net), м²'], ['area_with_balcony', 'Net с балконом, м²']] as const).map(([field, label]) => <label className="text-xs" key={field}>{label}<input className={control} type="number" min={0.01} step="0.01" value={detail?.[field] ?? ''} onChange={event => patchPlan(index, image, planIndex, { [field]: event.target.value === '' ? null : Number(event.target.value) })} /></label>)}</div></details>;
      })}
    </fieldset>)}</div><button type="button" onClick={() => onUnits([...units, { code: '', rooms: 1, area_min: null, area_max: null, price_min: null, price_max: null, plans: [], media_images: [], video_url: null, plan_details: [], position: units.length }])} className="mt-4 flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"><Plus size={15} />Добавить вариант</button></div>
  </section>;
}

function ImageOrder({ urls, onChange, label }: { urls: string[]; onChange: (urls: string[]) => void; label: string }) {
  const [link, setLink] = useState('');
  const move = (index: number, direction: number) => {
    const next = [...urls];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  return <div className="mt-3"><div className="grid gap-3 sm:grid-cols-2">{urls.map((url, index) => <div key={`${url}-${index}`} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-2">
    {isMediaUrl(url.trim()) ? <img src={displayImageUrl(url.trim(), 240)} alt={`${label} ${index + 1}`} className="h-16 w-24 shrink-0 bg-slate-100 object-cover" loading="lazy" /> : <div className="grid h-16 w-24 shrink-0 place-items-center bg-slate-100 text-xs text-slate-500">Нет предпросмотра</div>}
    <div className="min-w-0 flex-1"><p className="text-xs">{label} {index + 1}</p><p className="mt-1 truncate text-[10px] text-slate-500" title={url}>{url.startsWith('/uploads/') ? 'Файл сайта' : 'Внешний файл'}</p><div className="mt-2 flex gap-1">
      <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${label} ${index + 1}: раньше`} className="p-2 disabled:opacity-30"><ArrowUp size={14} /></button>
      <button type="button" disabled={index === urls.length - 1} onClick={() => move(index, 1)} aria-label={`${label} ${index + 1}: позже`} className="p-2 disabled:opacity-30"><ArrowDown size={14} /></button>
      <button type="button" onClick={() => onChange(urls.filter((_, i) => i !== index))} aria-label={`Убрать ${label.toLowerCase()} ${index + 1}`} className="p-2 text-red-600"><Trash2 size={14} /></button>
    </div></div>
  </div>)}</div>{urls.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Пока нет файлов. Загрузите изображения или добавьте ссылку.</p>}<div className="mt-3 flex max-w-xl gap-2"><input className={control} aria-label={`Ссылка: ${label}`} value={link} onChange={event => setLink(event.target.value)} placeholder="Ссылка на Google Drive или изображение" /><button type="button" disabled={!isMediaUrl(link.trim())} onClick={() => { onChange([...urls, link.trim()]); setLink(''); }} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"><Link2 size={15} />Добавить ссылку</button></div></div>;
}

export function VideoOrder({ urls, onChange, label, hiddenHeroVideos = [], onHeroVisibility }: { urls: string[]; onChange: (urls: string[]) => void; label: string; hiddenHeroVideos?: string[]; onHeroVisibility?: (url: string, visible: boolean) => void }) {
  const move = (index: number, direction: number) => {
    const next = [...urls];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  return <div className="mt-3 space-y-3">{urls.map((url, index) => <div key={`${url}-${index}`} className="flex min-w-0 flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"><div className="aspect-video w-full overflow-hidden bg-slate-900 sm:w-48">{videoEmbedUrl(url) ? <iframe src={videoEmbedUrl(url)!} title={`${label} ${index + 1}`} className="h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" /> : isDirectVideoUrl(url) ? <video src={url} controls preload="metadata" className="h-full w-full" /> : <a href={url} target="_blank" rel="noreferrer" className="grid h-full place-items-center text-sm text-white"><ExternalLink size={18} />Открыть видео</a>}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium"><Film size={15} className="mr-2 inline" />{label} {index + 1}</p>{onHeroVisibility && <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={!hiddenHeroVideos.includes(url)} onChange={event => onHeroVisibility(url, event.target.checked)} />Показывать в шапке</label>}{onHeroVisibility && <p className="mt-1 text-xs text-slate-500">В нижней галерее видео остаётся всегда.</p>}<p className="mt-1 truncate text-xs text-slate-500" title={url}>{url.startsWith('/uploads/') ? 'Файл сайта' : 'Внешнее видео'}</p><div className="mt-2 flex gap-1"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${label} ${index + 1}: раньше`} className="p-2 disabled:opacity-30"><ArrowUp size={14} /></button><button type="button" disabled={index === urls.length - 1} onClick={() => move(index, 1)} aria-label={`${label} ${index + 1}: позже`} className="p-2 disabled:opacity-30"><ArrowDown size={14} /></button><button type="button" onClick={() => onChange(urls.filter((_, i) => i !== index))} aria-label={`Убрать ${label.toLowerCase()} ${index + 1}`} className="p-2 text-red-600"><Trash2 size={14} /></button></div></div></div>)}{urls.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Видео пока не добавлено.</p>}</div>;
}

export function AddVideoLink({ onAdd }: { onAdd: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"><Link2 size={15} />Добавить ссылку</button>;
  return <div className="flex w-full max-w-xl gap-2"><input autoFocus className={control} value={url} onChange={event => setUrl(event.target.value)} placeholder="Google Drive, YouTube или Vimeo" /><button type="button" disabled={!isMediaUrl(url.trim())} onClick={() => { onAdd(url.trim()); setOpen(false); setUrl(''); }} className="rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-40">Добавить</button><button type="button" onClick={() => { setOpen(false); setUrl(''); }} aria-label="Отмена" className="rounded-lg px-2 text-sm text-slate-500">Отмена</button></div>;
}
