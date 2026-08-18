import { fetchCategories } from '@/lib/api';
import { CategoriesManager } from './CategoriesManager';
import { Tags } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Tags className="w-6 h-6 text-primary" />
          Категории недвижимости
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Управление разделами каталога (Квартиры, Дома, Участки, Коммерция и др.).
        </p>
      </div>

      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
