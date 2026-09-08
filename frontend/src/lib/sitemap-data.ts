import type { Locale } from '@/i18n/config';

export type SitemapEntry={url:string;lastModified?:string;languages:Record<string,string>};
export type SitemapItem={path:string;locales:Locale[];last_modified?:string};
const escapeXml=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const prefix='<?xml version="1.0" encoding="UTF-8"?>';
const start=`${prefix}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

export function buildSitemapEntries(origin:string,locales:Locale[],primary:Locale,items:SitemapItem[]):SitemapEntry[] {
  const paths=['','/properties','/collections','/services','/news','/reviews','/about','/contact','/privacy','/terms'];
  const result=new Map<string,SitemapEntry>();
  for(const item of [...paths.map(path=>({path,locales})),...items] as SitemapItem[]) {
    if(!item.path.startsWith('/') && item.path!=='')throw new Error('Invalid sitemap path');
    if(item.path.startsWith('//') || item.path.includes('\\') || /[?#]/.test(item.path))throw new Error('Invalid sitemap path');
    const available=locales.filter(locale=>item.locales.includes(locale));
    if(!available.length)continue;
    const preferred=available.includes(primary)?primary:available[0];
    const languages=Object.fromEntries([...available.map(locale=>[locale,`${origin}/${locale}${item.path}`]),['x-default',`${origin}/${preferred}${item.path}`]]);
    for(const locale of available) {
      const url=`${origin}/${locale}${item.path}`;
      result.set(url,{url,lastModified:item.last_modified,languages});
    }
  }
  return Array.from(result.values());
}

export function sitemapParts(entries:SitemapEntry[],limit=45000,maxBytes=45*1024*1024):string[] {
  const parts:string[]=[];let current:string[]=[];let bytes=start.length+9;
  for(const entry of entries) {
    const date=entry.lastModified && Number.isFinite(Date.parse(entry.lastModified))?`<lastmod>${escapeXml(entry.lastModified)}</lastmod>`:'';
    const xml=`<url><loc>${escapeXml(entry.url)}</loc>${date}${Object.entries(entry.languages).map(([locale,url])=>`<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(url)}"/>`).join('')}</url>`;
    const length=new TextEncoder().encode(xml).length;
    if(current.length && (current.length>=limit || bytes+length>maxBytes)){parts.push(`${start}${current.join('')}</urlset>`);current=[];bytes=start.length+9;}
    if(length+bytes>maxBytes)throw new Error('Sitemap entry is too large');
    current.push(xml);bytes+=length;
  }
  if(current.length || !parts.length)parts.push(`${start}${current.join('')}</urlset>`);
  return parts;
}

export function sitemapIndex(origin:string,count:number):string {
  return `${prefix}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({length:count},(_,id)=>`<sitemap><loc>${escapeXml(origin)}/sitemaps/${id}.xml</loc></sitemap>`).join('')}</sitemapindex>`;
}

export function createSitemapCache<T>(now=Date.now,ttl=300000,maxStale=86400000) {
  const snapshots=new Map<string,{value:T;updated:number}>();
  const pending=new Map<string,Promise<{value:T;stale:boolean}>>();
  return async (key:string,loader:()=>Promise<T>):Promise<{value:T;stale:boolean}>=>{
    const saved=snapshots.get(key);
    if(saved && now()-saved.updated<ttl)return {value:saved.value,stale:false};
    const running=pending.get(key);if(running)return running;
    const refresh=(async()=>{
      try{const value=await loader();snapshots.set(key,{value,updated:now()});return {value,stale:false};}
      catch(error){if(saved && now()-saved.updated<=maxStale)return {value:saved.value,stale:true};throw error;}
      finally{pending.delete(key);}
    })();
    pending.set(key,refresh);return refresh;
  };
}
