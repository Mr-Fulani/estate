import { fetchProperties } from '@/lib/api';
import { PropertyFilter } from '@/components/properties/PropertyFilter';
import { PropertyGrid } from '@/components/properties/PropertyGrid';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params: any = {};
  if (searchParams.category_id) params.category_id = searchParams.category_id;
  if (searchParams.city) params.city = searchParams.city;
  if (searchParams.min_price) params.min_price = searchParams.min_price;
  if (searchParams.max_price) params.max_price = searchParams.max_price;
  if (searchParams.rooms) params.rooms = searchParams.rooms;
  
  params.per_page = 12;

  const data = await fetchProperties(params);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Каталог недвижимости</h1>
        <p className="text-lg text-slate-600 max-w-3xl">
          Используйте фильтры ниже, чтобы найти идеальный объект, соответствующий вашим требованиям.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <PropertyFilter />
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="mb-4 text-slate-600 font-medium">
            Найдено объектов: {data.total}
          </div>
          <PropertyGrid properties={data.items} />
        </div>
      </div>
    </div>
  );
}
