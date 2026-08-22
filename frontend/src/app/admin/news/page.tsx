import Link from 'next/link';
import { Newspaper, PlusCircle } from 'lucide-react';

import { fetchAdminNews } from '@/lib/api';
import { NewsTable } from './NewsTable';
import { getAdminCookieHeader } from '@/lib/adminServer';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const adminCookie = await getAdminCookieHeader();
  const articles = await fetchAdminNews(adminCookie);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Newspaper className="h-6 w-6 text-primary" />Новости и блог</h1><p className="mt-1 text-sm text-slate-500">Публикации и переводы на русский, английский и турецкий.</p></div>
        <Link href="/admin/news/new" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800"><PlusCircle className="h-4 w-4" />Добавить публикацию</Link>
      </div>
      <NewsTable initialArticles={articles} />
    </div>
  );
}
