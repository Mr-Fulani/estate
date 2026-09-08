import { sitemapResponse } from '@/lib/sitemap-response';
export const dynamic='force-dynamic';
export async function GET(){return sitemapResponse();}
