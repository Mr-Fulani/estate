'use client';

import { useRef, useState } from 'react';
import { RichText } from '@/components/content/RichText';

export function ContentEditor({ id, value, onChange, required }: { id: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  const input = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const insert = (prefix: string, suffix = '', placeholder = 'Текст') => {
    const start = input.current?.selectionStart ?? value.length;
    const end = input.current?.selectionEnd ?? start;
    const selected = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + prefix + selected + suffix + value.slice(end));
    input.current?.focus();
  };
  return <div>
    <div className="mb-2 flex flex-wrap gap-2">
      {[['H2', '\n\n## '], ['H3', '\n\n### '], ['Список', '\n\n- '], ['Нумерация', '\n\n1. ']].map(([label, prefix]) => <button className="rounded border px-3 py-2 text-sm" type="button" key={label} onClick={() => insert(prefix, '\n\n')}>{label}</button>)}
      <button className="rounded border px-3 py-2 text-sm" type="button" onClick={() => insert('[', '](/)', 'Название страницы')}>Ссылка</button>
      <button className="rounded border px-3 py-2 text-sm" type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>Предпросмотр</button>
    </div>
    <textarea ref={input} id={id} required={required} rows={16} value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7" />
    <p className="mt-1 text-xs text-slate-500">Разделяйте блоки пустой строкой. Ссылка: [название](/язык/путь) или https://…; HTML отображается как текст.</p>
    {preview && <div className="mt-4 rounded-xl border bg-white p-5"><RichText content={value} /></div>}
  </div>;
}
