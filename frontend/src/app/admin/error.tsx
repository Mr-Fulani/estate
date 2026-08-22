'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><AlertTriangle className="mx-auto mb-4 h-9 w-9 text-red-500" /><h1 className="mb-2 text-xl font-bold text-slate-900">Не удалось загрузить раздел</h1><p className="mb-6 text-sm text-slate-500">Проверьте подключение к API и повторите попытку.</p><button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white"><RotateCcw className="h-4 w-4" />Повторить</button></div>;
}
