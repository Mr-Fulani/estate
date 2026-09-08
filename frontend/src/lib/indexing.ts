import type { SiteSettings } from '@/types';
import { getLocaleConfig } from '@/lib/runtime-locales';
import { getSiteOrigin } from '@/lib/site-config';
import { createHash, timingSafeEqual } from 'node:crypto';

export function indexingEnabled(): boolean {
  if(process.env.INDEXING_ENABLED !== 'true' || process.env.DEPLOYMENT_ENV !== 'production') return false;
  getSiteOrigin();
  return true;
}

export function readyForIndexing(settings: SiteSettings): boolean {
  const home=settings.profile?.seo?.[getLocaleConfig().defaultLocale]?.home;
  return indexingEnabled() && Boolean(settings.profile?.brand_name?.trim() && settings.profile.content_reviewed && (settings.phone?.trim() || settings.email?.trim()) && home?.title.trim() && home.description.trim());
}

/** Preview access is an environment concern; credentials never enter HTML or client props. */
export function previewResponse(request: Request): Response | null {
  if(process.env.DEPLOYMENT_ENV !== 'preview') return null;
  const username=process.env.PREVIEW_USERNAME;
  const password=process.env.PREVIEW_PASSWORD;
  const headers={'X-Robots-Tag':'noindex, nofollow','Cache-Control':'private, no-store'};
  if(!username || !password) return new Response('Preview access is not configured',{status:503,headers});
  let valid=false;
  try {
    const authorization=request.headers.get('authorization') || '';
    if(authorization.startsWith('Basic ')) {
      const supplied=Buffer.from(authorization.slice(6),'base64').toString('utf8');
      const hash=(value:string)=>createHash('sha256').update(value).digest();
      valid=timingSafeEqual(hash(supplied),hash(`${username}:${password}`));
    }
  }catch{valid=false;}
  return valid?null:new Response('Authentication required',{status:401,headers:{...headers,'WWW-Authenticate':'Basic realm="Preview", charset="UTF-8"'}});
}
