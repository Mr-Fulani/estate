import Link from 'next/link';
import { getSiteOrigin } from '@/lib/site-config';

export function Breadcrumbs({ items }: { items: Array<{ name: string; href: string }> }) {
  const data = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:new URL(item.href,getSiteOrigin()).toString()})),
  };
  return <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}} />
    <ol className="flex flex-wrap items-center gap-2">{items.map((item,index)=><li className="inline-flex items-center gap-2" key={item.href}>{index>0 && <span aria-hidden="true">/</span>}{index===items.length-1 ? <span aria-current="page">{item.name}</span> : <Link href={item.href} className="hover:text-primary">{item.name}</Link>}</li>)}</ol>
  </nav>;
}
