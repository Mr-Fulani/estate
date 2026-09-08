import { getSiteCopy } from '@/lib/site-profile';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { fetchLandingPage, fetchProperties, fetchSiteSettings } from '@/lib/api';
import { getLocaleConfig, defaultAvailableLocale } from '@/lib/runtime-locales';
import { landingLocales, collectionsLabel } from '@/lib/landing-pages';
import { localizedPageMetadata } from '@/lib/seo';
import { paginationPage, assertPageExists, type SearchQuery } from '@/lib/pagination';
import { indexableQuery } from '@/lib/query-policy';
import { PropertyGrid } from '@/components/properties/PropertyGrid';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RichText } from '@/components/content/RichText';

type Props = {params:Promise<{locale:string;slug:string}>;searchParams:Promise<SearchQuery>};
export const dynamic='force-dynamic';

async function load(props: Props) {
  const [{locale,slug},query]=await Promise.all([props.params,props.searchParams]);
  if (!isLocale(locale)) notFound();
  const landing=await fetchLandingPage(slug);
  if (!landing || !landing.is_published) notFound();
  const available=landingLocales(landing,getLocaleConfig().locales);
  if (!available.includes(locale)) notFound();
  const copy=landing.translations[locale]!;
  const page=paginationPage(query.page);
  const filters=Object.fromEntries(Object.entries(landing.filters).filter(([,value])=>value!==null && value!==''));
  const properties=await fetchProperties({...filters,page,per_page:12});
  assertPageExists(page,properties.total,properties.per_page);
  return {locale,slug,copy,available,page,properties,query};
}

export async function generateMetadata(props: Props) {
  const {locale,slug,copy,available,page,query}=await load(props);
  const suffix=page>1?`?page=${page}`:'';
  const metadata=await localizedPageMetadata(locale,`/collections/${slug}`,copy.meta_title || copy.title,copy.description,{canonicalSuffix:suffix,index:indexableQuery(query)});
  return {...metadata,alternates:{canonical:`/${locale}/collections/${slug}${suffix}`,languages:Object.fromEntries([...available.map(value=>[value,`/${value}/collections/${slug}${suffix}`]),['x-default',`/${defaultAvailableLocale(available)}/collections/${slug}${suffix}`]])}};
}

export default async function CollectionPage(props: Props) {
  const {locale,slug,copy,page,properties}=await load(props);
  const path=`/${locale}/collections/${slug}`;
  const totalPages=Math.ceil(properties.total/properties.per_page);
  const messages=getMessages(locale);
  return <div className="container mx-auto px-4 py-10 md:px-6">
    <Breadcrumbs items={[{name:messages.navigation.home,href:`/${locale}`},{name:collectionsLabel[locale],href:`/${locale}/collections`},{name:copy.title,href:path}]} />
    <h1 className="mb-5 max-w-4xl text-4xl font-bold text-slate-950">{copy.title}</h1>
    <p className="mb-8 max-w-3xl text-lg text-slate-600">{copy.description}</p>
    <div className="mb-12 max-w-3xl"><RichText content={copy.content}/></div>
    <PropertyGrid properties={properties.items} locale={locale} emptyMessage={getSiteCopy(locale,await fetchSiteSettings()).catalog.empty}/>
    {totalPages>1 && <nav className="mt-10 flex justify-center gap-5" aria-label="Pagination">{page>1 && <Link href={`${path}?page=${page-1}`}>{messages.common.previous}</Link>}<span>{page} / {totalPages}</span>{page<totalPages && <Link href={`${path}?page=${page+1}`}>{messages.common.next}</Link>}</nav>}
  </div>;
}
