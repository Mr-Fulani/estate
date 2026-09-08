import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { fetchLandingPages } from '@/lib/api';
import { landingLocales, collectionsLabel } from '@/lib/landing-pages';
import { staticPageMetadata } from '@/lib/seo';

export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}: Props) {
  const {locale}=await params;if(!isLocale(locale)) return {};
  return staticPageMetadata(locale,'collections');
}
export default async function CollectionsPage({params}: Props) {
  const {locale}=await params;if(!isLocale(locale)) notFound();
  const pages=(await fetchLandingPages()).filter(page=>page.is_published && landingLocales(page,[locale]).length);
  return <div className="container mx-auto px-4 py-12 md:px-6"><h1 className="mb-10 text-4xl font-bold">{collectionsLabel[locale]}</h1><div className="grid gap-6 md:grid-cols-2">{pages.map(page=><article key={page.id} className="rounded-2xl border bg-white p-6"><h2 className="mb-3 text-2xl font-bold"><Link href={`/${locale}/collections/${page.slug}`}>{page.translations[locale]!.title}</Link></h2><p className="text-slate-600">{page.translations[locale]!.description}</p></article>)}</div></div>;
}
