'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

import { useLocale } from '@/context/LocaleContext';

export default function LocalizedError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { messages } = useLocale();
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="h-7 w-7" /></span>
        <h1 className="mb-3 text-2xl font-bold text-slate-900">{messages.common.errorTitle}</h1>
        <p className="mb-7 leading-relaxed text-slate-600">{messages.common.errorDescription}</p>
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition hover:bg-primary-800"><RotateCcw className="h-4 w-4" />{messages.common.retry}</button>
      </div>
    </main>
  );
}
