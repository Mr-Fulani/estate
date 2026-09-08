import { getApiBaseUrl } from '@/lib/api';
import { getSiteOrigin } from '@/lib/site-config';
import { getLocaleConfig } from '@/lib/runtime-locales';
import { buildSitemapEntries, sitemapParts, sitemapIndex, createSitemapCache, type SitemapItem } from '@/lib/sitemap-data';

const cached=createSitemapCache<string[]>();
export async function sitemapResponse(part?:string):Promise<Response> {
  const origin=getSiteOrigin();const config=getLocaleConfig();
  try {
    const snapshot=await cached(`${origin}|${getApiBaseUrl()}|${config.locales.join(',')}|${config.defaultLocale}`,async()=>{
      const response=await fetch(`${getApiBaseUrl()}/seo/sitemap`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error(`Sitemap source status ${response.status}`);
      const data=await response.json() as {items:SitemapItem[]};
      if(!Array.isArray(data.items))throw new Error('Invalid sitemap snapshot');
      return sitemapParts(buildSitemapEntries(origin,config.locales,config.defaultLocale,data.items));
    });
    if(snapshot.stale)console.error('Sitemap source unavailable: serving the last successful snapshot');
    const {value:parts}=snapshot;
    let body:string;
    if(part!==undefined){
      if(!/^(0|[1-9]\d*)\.xml$/.test(part))return new Response('Not found',{status:404});
      const id=Number(part.slice(0,-4));if(!parts[id])return new Response('Not found',{status:404});body=parts[id];
    }else body=parts.length===1?parts[0]:sitemapIndex(origin,parts.length);
    return new Response(body,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300','X-Sitemap-Stale':snapshot.stale?'1':'0'}});
  }catch{
    console.error('Sitemap source unavailable and no usable snapshot exists');
    return new Response('Sitemap temporarily unavailable',{status:503,headers:{'Retry-After':'300','Cache-Control':'no-store'}});
  }
}
