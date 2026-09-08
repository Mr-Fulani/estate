import { legalCopy } from '@/i18n/legalCopy';
import { applyCopy, brandName } from '@/lib/site-profile';
import { fetchSiteSettings } from '@/lib/api';
import type { Locale } from '@/i18n/config';


export async function LegalPage({ locale, type }: { locale: Locale; type: 'privacy' | 'terms' }) {
  const settings = await fetchSiteSettings();
  const localeCopy = applyCopy(legalCopy[locale], settings.profile?.copy?.[locale] || {}, brandName(settings), 'legal');
  const copy = localeCopy[type];
  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-16">
      <article className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <p className="mb-3 text-sm font-semibold text-secondary-700">{localeCopy.updated}</p>
          <h1 className="mb-5 text-3xl font-bold text-slate-950 md:text-5xl">{copy.title}</h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-600">{copy.intro}</p>
          <div className="space-y-8">
            {copy.sections.map(([title, content]) => <section key={title}><h2 className="mb-2 text-xl font-bold text-slate-900">{title}</h2><p className="leading-7 text-slate-600">{content}</p></section>)}
          </div>
        </div>
      </article>
    </div>
  );
}
