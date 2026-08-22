'use client';

import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

import { useLocale } from '@/context/LocaleContext';

export default function LocalizedNotFound() {
  const { messages, href } = useLocale();
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-lg text-center">
        <SearchX className="mx-auto mb-5 h-14 w-14 text-primary/30" />
        <p className="mb-2 text-sm font-black uppercase tracking-[0.3em] text-secondary">404</p>
        <h1 className="mb-3 text-3xl font-bold text-slate-950 md:text-4xl">{messages.common.notFoundTitle}</h1>
        <p className="mb-7 text-slate-600">{messages.common.notFoundDescription}</p>
        <Link href={href('/')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-white transition hover:bg-primary-800"><ArrowLeft className="h-4 w-4" />{messages.navigation.home}</Link>
      </div>
    </main>
  );
}
