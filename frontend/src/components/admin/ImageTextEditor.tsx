'use client';

import type { Locale } from '@/i18n/config';
import type { ImageDetails } from '@/lib/image-text';

export function ImageTextEditor({ url, locale, value, onChange }: { url: string; locale: Locale; value?: ImageDetails; onChange: (value: ImageDetails) => void }) {
  const current = value?.[url]?.[locale] || {};
  const update = (change: typeof current) => onChange({ ...value, [url]: { ...value?.[url], [locale]: { ...current, ...change } } });
  return <fieldset className="space-y-2 p-3 text-xs" draggable={false} onDragStart={event => event.stopPropagation()}>
    <legend>Описание фото · {locale.toUpperCase()}</legend>
    <label className="block">Что изображено (alt)<input className="mt-1 w-full rounded border p-2" disabled={current.decorative} maxLength={500} value={current.alt || ''} onChange={event => update({ alt: event.target.value })} /></label>
    <label className="block">Подпись<input className="mt-1 w-full rounded border p-2" maxLength={1000} value={current.caption || ''} onChange={event => update({ caption: event.target.value })} /></label>
    <label className="flex gap-2"><input type="checkbox" checked={current.decorative || false} onChange={event => update({ decorative: event.target.checked })} />Декоративное изображение (пустой alt)</label>
  </fieldset>;
}
