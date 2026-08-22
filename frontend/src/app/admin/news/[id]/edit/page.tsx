import { Edit3 } from 'lucide-react';
import { notFound } from 'next/navigation';

import { fetchAdminNewsArticle } from '@/lib/api';
import { NewsForm } from '../../NewsForm';
import { getAdminCookieHeader } from '@/lib/adminServer';

export const dynamic = 'force-dynamic';

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminCookie = await getAdminCookieHeader();
  const article = await fetchAdminNewsArticle(id, adminCookie);
  if (!article) notFound();
  return <div className="space-y-6"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Edit3 className="h-6 w-6 text-primary" />Редактирование публикации</h1><p className="mt-1 text-sm text-slate-500">/{article.slug}</p></div><NewsForm initialData={article} /></div>;
}
