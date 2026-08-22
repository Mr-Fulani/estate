import { Property } from '@/types';
import { PropertyCard } from './PropertyCard';
import type { Locale } from '@/i18n/config';

interface PropertyGridProps {
  properties: Property[];
  emptyMessage?: string;
  locale?: Locale;
}

export function PropertyGrid({ 
  properties, 
  emptyMessage = 'Объекты не найдены',
  locale = 'ru',
}: PropertyGridProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} locale={locale} />
      ))}
    </div>
  );
}
