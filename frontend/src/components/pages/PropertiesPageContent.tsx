import Link from 'next/link';

import { PropertyFilter } from '@/components/properties/PropertyFilter';
import { PropertyGrid } from '@/components/properties/PropertyGrid';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { siteCopy } from '@/i18n/siteCopy';
import { fetchCategories, fetchProperties } from '@/lib/api';

export type PropertySearchParams = { [key: string]: string | string[] | undefined };

export async function PropertiesPageContent({ searchParams, locale }: { searchParams: Promise<PropertySearchParams> | PropertySearchParams; locale: Locale }) {
  const resolvedParams = await searchParams;
  const copy = siteCopy[locale].catalog;
  const messages = getMessages(locale);
  const scalar = (key: string) => {
    const value = resolvedParams?.[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const params: Parameters<typeof fetchProperties>[0] = {};
  const search = scalar('search');
  const city = scalar('city');
  if (search) params.search = search;
  if (city) params.city = city;
  for (const key of ['category_id', 'min_price', 'max_price', 'rooms', 'min_rooms', 'min_area', 'max_area', 'page'] as const) {
    const value = scalar(key);
    if (value && Number.isFinite(Number(value))) params[key] = Number(value);
  }
  params.per_page = 12;

  const [data, categories] = await Promise.all([
    fetchProperties(params),
    fetchCategories(),
  ]);
  const totalPages = Math.ceil(data.total / data.per_page);
  const pageHref = (targetPage: number) => {
    const query = new URLSearchParams();
    Object.entries(resolvedParams || {}).forEach(([key, value]) => {
      if (key === 'page' || value === undefined) return;
      query.set(key, Array.isArray(value) ? value[0] : value);
    });
    query.set('page', String(targetPage));
    return `${localizeHref(locale, '/properties')}?${query.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8"><h1 className="mb-2 text-3xl font-bold text-slate-900 md:text-4xl">{copy.title}</h1><p className="max-w-3xl text-slate-600">{copy.description}</p></div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1"><div className="lg:sticky lg:top-24 lg:z-20 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto lg:pe-1"><PropertyFilter categories={categories} /></div></aside>
          <div className="lg:col-span-3">
            <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm font-semibold text-slate-700">{copy.found}: <span className="font-bold text-primary">{data.total}</span></div></div>
            <PropertyGrid properties={data.items} locale={locale} emptyMessage={copy.empty} />
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-3" aria-label={`${copy.title}: ${copy.found}`}>
                {data.page > 1 ? <Link href={pageHref(data.page - 1)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:border-primary hover:text-primary">{messages.common.previous}</Link> : <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 font-semibold text-slate-400" aria-disabled="true">{messages.common.previous}</span>}
                <span className="text-sm font-medium text-slate-600">{data.page} / {totalPages}</span>
                {data.page < totalPages ? <Link href={pageHref(data.page + 1)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:border-primary hover:text-primary">{messages.common.next}</Link> : <span className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 font-semibold text-slate-400" aria-disabled="true">{messages.common.next}</span>}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
