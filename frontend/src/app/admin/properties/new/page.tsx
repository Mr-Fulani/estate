import { fetchCategories } from '@/lib/api';
import { PropertyForm } from '../PropertyForm';
import { Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NewPropertyPage() {
  const categories = await fetchCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Добавление нового объекта недвижимости
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Заполните данные об объекте, загрузите фотографии и укажите стоимость.
        </p>
      </div>

      <PropertyForm categories={categories} />
    </div>
  );
}
