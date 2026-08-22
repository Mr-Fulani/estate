import { Star } from 'lucide-react';

import { fetchAdminReviews } from '@/lib/api';
import { ReviewsManager } from './ReviewsManager';
import { getAdminCookieHeader } from '@/lib/adminServer';


export const dynamic = 'force-dynamic';


export default async function AdminReviewsPage() {
  const adminCookie = await getAdminCookieHeader();
  const reviews = await fetchAdminReviews(adminCookie);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Star className="h-6 w-6 text-secondary" />Отзывы клиентов</h1>
        <p className="mt-1 text-sm text-slate-500">Модерация, переводы RU/EN/TR/AR, подтверждение сделки и выбор отзывов для главной.</p>
      </div>
      <ReviewsManager initialReviews={reviews} />
    </div>
  );
}
