import { Property } from '@/types';
import { formatArea } from '@/lib/utils';
import { MapPin, Bed, Maximize, Layers, Calendar } from 'lucide-react';
import { PropertyGallery } from './PropertyGallery';
import type { Locale } from '@/i18n/config';
import { localizedCategoryName, localizedProperty, roomLabel } from '@/i18n/domain';
import { siteCopy } from '@/i18n/siteCopy';
import { CurrencyPrice } from '@/components/currency/CurrencyPrice';

export function PropertyDetails({ property: sourceProperty, locale }: { property: Property; locale: Locale }) {
  const property = localizedProperty(sourceProperty, locale);
  const copy = siteCopy[locale].property;
  const location = [property.city, property.district, property.address].filter(Boolean).join(', ');
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Interactive Photo Gallery with Zoom & Thumbnails */}
      <div className="p-4 md:p-6 pb-0">
        <PropertyGallery
          images={property.images || []}
          title={property.title}
          isFeatured={property.is_featured}
          categoryName={localizedCategoryName(locale, property.category?.slug, property.category?.name, property.category?.translations)}
          isActive={property.is_active}
          statusBadge={property.status_badge}
        />
      </div>

      <div className="p-6 md:p-8">
        <h1 dir="auto" className="text-2xl md:text-4xl font-bold text-slate-900 mb-3">
          {property.title}
        </h1>
        
        <div className="text-3xl md:text-4xl font-black text-primary mb-6">
          <CurrencyPrice amount={property.price} sourceCurrency={property.currency} locale={locale} />
        </div>

        <div className="flex items-start text-slate-600 mb-8 text-base md:text-lg gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
          <span dir="auto">{location}</span>
        </div>

        {/* Characteristics Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{copy.parameters}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Maximize className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">{copy.area}</div>
                <div className="text-sm md:text-base font-bold text-slate-900"><bdi dir="ltr">{formatArea(property.area)}</bdi></div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">{copy.rooms}</div>
                <div className="text-sm md:text-base font-bold text-slate-900" dir="auto">
                  {property.rooms ? roomLabel(locale, property.rooms) : copy.freePlan}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">{copy.floor}</div>
                <div className="text-sm md:text-base font-bold text-slate-900">
                  <bdi dir="ltr">{property.floor ? `${property.floor} / ${property.total_floors || '?'}` : '-'}</bdi>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">{copy.year}</div>
                <div className="text-sm md:text-base font-bold text-slate-900"><bdi dir="auto">{property.year_built || copy.unspecified}</bdi></div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{copy.description}</h3>
          <div className="max-w-none space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
            {property.description ? (
              property.description.split('\n').map((paragraph, i) => (
                <p dir="auto" key={i}>{paragraph}</p>
              ))
            ) : (
              <p className="text-slate-400 italic">{copy.noDescription}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
