import { Property } from '@/types';
import { formatPrice, formatArea, pluralize } from '@/lib/utils';
import { MapPin, Bed, Maximize, Layers, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PropertyGallery } from './PropertyGallery';

export function PropertyDetails({ property }: { property: Property }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Interactive Photo Gallery with Zoom & Thumbnails */}
      <div className="p-4 md:p-6 pb-0">
        <PropertyGallery
          images={property.images || []}
          title={property.title}
          isFeatured={property.is_featured}
          categoryName={property.category?.name}
          isActive={property.is_active}
          statusBadge={property.status_badge}
        />
      </div>

      <div className="p-6 md:p-8">
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3">
          {property.title}
        </h1>
        
        <div className="text-3xl md:text-4xl font-black text-primary mb-6">
          {formatPrice(property.price, property.currency)}
        </div>

        <div className="flex items-start text-slate-600 mb-8 text-base md:text-lg gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
          <span>
            {property.city}
            {property.district ? `, ${property.district}` : ''}
            {property.address ? `, ${property.address}` : ''}
          </span>
        </div>

        {/* Characteristics Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Основные параметры</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Maximize className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Площадь</div>
                <div className="text-sm md:text-base font-bold text-slate-900">{formatArea(property.area)}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Комнаты</div>
                <div className="text-sm md:text-base font-bold text-slate-900">
                  {property.rooms ? pluralize(property.rooms, ['комната', 'комнаты', 'комнат']) : 'Своб. план.'}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Этаж</div>
                <div className="text-sm md:text-base font-bold text-slate-900">
                  {property.floor ? `${property.floor} из ${property.total_floors || '?'}` : '-'}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Год постройки</div>
                <div className="text-sm md:text-base font-bold text-slate-900">{property.year_built || 'Не указан'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Описание объекта</h3>
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm md:text-base space-y-4">
            {property.description ? (
              property.description.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))
            ) : (
              <p className="text-slate-400 italic">Описание пока не добавлено</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
