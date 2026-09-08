import { sitemapResponse } from '@/lib/sitemap-response';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{part:string}>}){return sitemapResponse((await params).part);}
