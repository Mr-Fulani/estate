import { fetchProperties } from '@/lib/api';
import { PropertyFilter } from '@/components/properties/PropertyFilter';
import { PropertyGrid } from '@/components/properties/PropertyGrid';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const resolvedParams = await searchParams;
  const params: any = {};
  
  if (resolvedParams?.category_id) params.category_id = resolvedParams.category_id;
  if (resolvedParams?.city) params.city = resolvedParams.city;
  if (resolvedParams?.min_price) params.min_price = resolvedParams.min_price;
  if (resolvedParams?.max_price) params.max_price = resolvedParams.max_price;
  if (resolvedParams?.rooms) params.rooms = resolvedParams.rooms;
  if (resolvedParams?.min_area) params.min_area = resolvedParams.min_area;
  if (resolvedParams?.max_area) params.max_area = resolvedParams.max_area;
  
  params.per_page = 12;

  const data = await fetchProperties(params);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-4 md:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Каталог недвижимости</h1>
          <p className="text-slate-600 max-w-3xl">
            Подберите идеальный вариант с помощью удобного фильтра параметров.
          </p>
        </div>

        {/* Catalog Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <PropertyFilter />
            </div>
          </div>
          
          {/* Main Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-5 bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-sm font-semibold text-slate-700">
                Найдено предложений:{' '}
                <span className="text-primary font-bold">{data.total}</span>
              </div>
            </div>

            <PropertyGrid properties={data.items} />
          </div>
        </div>
      </div>
    </div>
  );
}
