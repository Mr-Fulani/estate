'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Upload } from 'lucide-react';
import { uploadPropertyImage } from '@/lib/api';
import type { DevelopmentCopy, DevelopmentProfile, PropertyUnitType, PropertyPlanDetail } from '@/types';
import { locales, localeLabels, type Locale } from '@/i18n/config';

import { isMediaUrl } from '@/lib/development-view';
const emptyCopy: DevelopmentCopy = { eyebrow: '', headline: '', story_title: '', story: '', location_description: '', purchase_note: '', amenities: [] };
const control = 'mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900';

export function PropertyImageUpload({ onUploaded, onBusy, multiple = true, label = 'Загрузить изображения' }: { onUploaded: (urls: string[]) => void; onBusy?: (busy: boolean) => void; multiple?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-primary"><Upload size={15} />{busy ? 'Загрузка…' : label}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={multiple} disabled={busy} className="sr-only" onChange={async event => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setBusy(true); onBusy?.(true); setError('');
    const urls: string[] = [];
    try { for (const file of files) urls.push(await uploadPropertyImage(file)); }
    catch (error) { setError(error instanceof Error ? error.message : 'Ошибка загрузки'); }
    finally { if (urls.length) onUploaded(urls); setBusy(false); onBusy?.(false); }
  }} /></label>{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}

export function DevelopmentEditor({ profile, units, onProfile, onUnits, onBusy }: { profile: DevelopmentProfile; units: PropertyUnitType[]; onProfile: (value: DevelopmentProfile) => void; onUnits: (value: PropertyUnitType[]) => void; onBusy: (busy: boolean) => void }) {
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
    <div className="border-t border-slate-100 pt-5"><h3 className="mb-3 font-semibold">Тексты страницы комплекса</h3><div className="mb-4 flex flex-wrap gap-2">{locales.map(value => <button type="button" key={value} aria-pressed={locale === value} onClick={() => setLocale(value)} className={`rounded-lg border px-3 py-2 text-sm ${locale === value ? 'bg-primary text-white' : ''}`}>{localeLabels[value]}</button>)}</div>
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="grid gap-4 md:grid-cols-2">
        {([['eyebrow', 'Подзаголовок над названием'], ['headline', 'Фраза на первом экране'], ['story_title', 'Заголовок «О проекте»'], ['story', 'История интерьеров'], ['location_description', 'Описание расположения'], ['purchase_note', 'Условия покупки / примечание']] as const).map(([field, label]) => <label key={field} className="text-sm">{label}<textarea className={control} rows={field === 'story' || field === 'location_description' ? 4 : 2} value={copy[field]} onChange={event => patchCopy({ [field]: event.target.value })} /></label>)}
        <label className="text-sm md:col-span-2">Инфраструктура — один пункт в строке<textarea className={control} rows={4} value={copy.amenities.join('\n')} onChange={event => patchCopy({ amenities: event.target.value.split('\n') })} /></label>
      </div>
    </div>
    <div className="border-t border-slate-100 pt-5"><h3 className="mb-3 font-semibold">Интерьерная галерея</h3><p className="mb-3 text-xs text-slate-500">Порядок строк задаёт порядок фотографий в галерее. Общая обложка выбирается в разделе фотографий объекта. Если не добавить интерьеры, галерея и пункт меню будут скрыты.</p><textarea aria-label="Ссылки на интерьерные изображения" className={control} rows={4} value={profile.interior_images.join('\n')} onChange={event => patchProfile({ interior_images: event.target.value.split('\n') })} /><ImageOrder urls={profile.interior_images} onChange={interior_images => patchProfile({ interior_images })} label="Интерьер" /><div className="mt-3"><PropertyImageUpload onBusy={onBusy} onUploaded={urls => patchProfile({ interior_images: [...profile.interior_images.filter(Boolean), ...urls] })} /></div></div>
    <div className="border-t border-slate-100 pt-5"><h3 className="mb-4 font-semibold">Варианты квартир</h3><div className="space-y-5">{units.map((unit, index) => <fieldset key={unit.id ?? index} className="rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold">Вариант {index + 1}</legend><div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <label className="text-xs">Название (например 1+1)<input required maxLength={40} className={control} value={unit.code} onChange={event => patchUnit(index, { code: event.target.value })} /></label>
      <label className="text-xs">Спальни (для фильтра)<input required min={1} max={50} type="number" className={control} value={unit.rooms || ''} onChange={event => patchUnit(index, { rooms: Number(event.target.value) })} /></label>
      {([['area_min', 'Площадь от, м²'], ['area_max', 'Площадь до, м²'], ['price_min', 'Цена от'], ['price_max', 'Цена до']] as const).map(([field, label]) => <label className="text-xs" key={field}>{label}<input min={0.01} step="0.01" type="number" placeholder="По запросу" className={control} value={unit[field] ?? ''} onChange={event => patchUnit(index, { [field]: event.target.value === '' ? null : Number(event.target.value) })} /></label>)}
      <label className="col-span-2 text-xs md:col-span-3">Планировки — одна ссылка в строке<textarea className={control} rows={2} value={unit.plans.join('\n')} onChange={event => patchUnit(index, { plans: event.target.value.split('\n') })} /></label>
    </div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><PropertyImageUpload label="Загрузить планировки" onBusy={onBusy} onUploaded={urls => patchUnit(index, { plans: [...unit.plans.filter(Boolean), ...urls] })} /><button type="button" onClick={() => onUnits(units.filter((_, i) => i !== index))} className="flex items-center gap-2 text-xs text-red-600"><Trash2 size={14} />Убрать вариант</button></div>
      <ImageOrder urls={unit.plans} onChange={plans => patchUnit(index, { plans })} label="Планировка" />
      {unit.plans.map((value, planIndex) => {
        const image = value.trim();
        if (!image) return null;
        const detail = unit.plan_details?.find(item => item.image === image);
        return <details key={`${image}-${planIndex}`} className="mt-4 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm">Параметры плана {planIndex + 1}{detail?.code ? ` · ${detail.code}` : ''}</summary><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-xs">Код / название плана<input className={control} value={detail?.code || ''} maxLength={60} onChange={event => patchPlan(index, image, planIndex, { code: event.target.value })} /></label>{([['area_gross', 'Общая площадь (gross), м²'], ['area_net', 'Полезная площадь (net), м²'], ['area_with_balcony', 'Net с балконом, м²']] as const).map(([field, label]) => <label className="text-xs" key={field}>{label}<input className={control} type="number" min={0.01} step="0.01" value={detail?.[field] ?? ''} onChange={event => patchPlan(index, image, planIndex, { [field]: event.target.value === '' ? null : Number(event.target.value) })} /></label>)}</div></details>;
      })}
    </fieldset>)}</div><button type="button" onClick={() => onUnits([...units, { code: '', rooms: 1, area_min: null, area_max: null, price_min: null, price_max: null, plans: [], plan_details: [], position: units.length }])} className="mt-4 flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"><Plus size={15} />Добавить вариант</button></div>
  </section>;
}

function ImageOrder({ urls, onChange, label }: { urls: string[]; onChange: (urls: string[]) => void; label: string }) {
  const move = (index: number, direction: number) => {
    const next = [...urls];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  return <div className="mt-3 grid gap-3 sm:grid-cols-2">{urls.map((url, index) => isMediaUrl(url.trim()) && <div key={index} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-2">
    {/* User-supplied URLs can change while typing; use a native thumbnail without the image optimizer. */}
    <img src={url.trim()} alt={`${label} ${index + 1}`} className="h-16 w-24 shrink-0 bg-slate-100 object-contain" loading="lazy" />
    <div><p className="text-xs">{label} {index + 1}</p><div className="mt-2 flex gap-1">
      <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${label} ${index + 1}: раньше`} className="p-2 disabled:opacity-30"><ArrowUp size={14} /></button>
      <button type="button" disabled={index === urls.length - 1} onClick={() => move(index, 1)} aria-label={`${label} ${index + 1}: позже`} className="p-2 disabled:opacity-30"><ArrowDown size={14} /></button>
      <button type="button" onClick={() => onChange(urls.filter((_, i) => i !== index))} aria-label={`Убрать ${label.toLowerCase()} ${index + 1}`} className="p-2 text-red-600"><Trash2 size={14} /></button>
    </div></div>
  </div>)}</div>;
}
