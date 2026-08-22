import Link from 'next/link';
import { PlusCircle, Building2 } from 'lucide-react';
import { fetchProperties, fetchCategories } from '@/lib/api';
import { PropertiesTable } from './PropertiesTable';
import { getAdminCookieHeader } from '@/lib/adminServer';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const adminCookie = await getAdminCookieHeader();
  const [propsData, categories] = await Promise.all([
    fetchProperties({ per_page: 100, sort_by: 'created_at', order: 'desc', include_inactive: true }, adminCookie),
    fetchCategories(),
  ]);

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Каталог объектов недвижимости
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Управление объектами: добавление новых объявлений, изменение цен, фото и статусов.
          </p>
        </div>

        <Link
          href="/admin/properties/new"
          className="bg-primary hover:bg-primary-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Добавить объект
        </Link>
      </div>

      {/* Properties Table */}
      <PropertiesTable initialProperties={propsData.items} categories={categories} />
    </div>
  );
}
