'use client';

import Image from 'next/image';
import { useLocale } from '@/context/LocaleContext';
import { siteCopy } from '@/i18n/siteCopy';

export default function AboutPage() {
  const { locale } = useLocale();
  const copy = siteCopy[locale].about;

  return (
    <div className="bg-white">
      <section className="bg-primary-900 py-16 text-white md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="mb-6 max-w-4xl text-4xl font-bold md:text-5xl">{copy.title}</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-primary-100 md:text-xl">{copy.intro}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 md:px-6">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-slate-900">{copy.approachTitle}</h2>
            <div className="space-y-5 text-lg leading-relaxed text-slate-600">
              {copy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-200 shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt={copy.approachTitle}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
