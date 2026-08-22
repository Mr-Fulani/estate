'use client';

import type { Locale } from '@/i18n/config';
import { useLocale } from '@/context/LocaleContext';
import { siteCopy } from '@/i18n/siteCopy';

const statValues = ['10+', '500+', '1000+', '25'];
const portraits = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=512&q=80',
];

const teamNames: Record<Locale, string[]> = {
  ru: ['Александр Петров', 'Мария Сидорова', 'Игорь Васильев'],
  en: ['Alexander Petrov', 'Maria Sidorova', 'Igor Vasilyev'],
  tr: ['Alexander Petrov', 'Maria Sidorova', 'Igor Vasilyev'],
};

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
        <section className="mb-20 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8" aria-label={copy.title}>
          {statValues.map((value, index) => (
            <div key={value} className="rounded-2xl bg-slate-50 p-5 text-center md:p-6">
              <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">{value}</div>
              <div className="text-sm font-medium text-slate-600 md:text-base">{copy.stats[index]}</div>
            </div>
          ))}
        </section>

        <section className="mb-20 grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-slate-900">{copy.approachTitle}</h2>
            <div className="space-y-5 text-lg leading-relaxed text-slate-600">
              {copy.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-200 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt={copy.approachTitle}
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">{copy.teamTitle}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {portraits.map((portrait, index) => (
              <article key={portrait} className="text-center">
                <div className="mx-auto mb-6 h-44 w-44 overflow-hidden rounded-full border-4 border-slate-50 md:h-48 md:w-48">
                  <img src={portrait} alt={teamNames[locale][index]} className="h-full w-full object-cover" />
                </div>
                <h3 className="mb-1 text-xl font-bold text-slate-900">{teamNames[locale][index]}</h3>
                <p className="font-medium text-primary">{copy.roles[index]}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
