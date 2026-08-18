import { Property } from '@/types';
import { formatPrice, formatArea, pluralize } from '@/lib/utils';
import { MapPin, Bed, Maximize, Layers, Calendar, Home, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function PropertyDetails({ property }: { property: Property }) {
  const imageUrls = property.images && property.images.length > 0 
    ? property.images 
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Gallery */}
      <div className="w-full">
        {imageUrls ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-[400px]">
              <img src={imageUrls[0]} alt={property.title} className="w-full h-full object-cover rounded-lg" />
            </div>
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-2 gap-2 h-[400px] hidden md:grid">
                {imageUrls.slice(1, 5).map((url, i) => (
                  <img key={i} src={url} alt={`${property.title} ${i+2}`} className="w-full h-full object-cover rounded-lg" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[21/9] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <span className="text-primary-400 font-medium">Фотографии скоро появятся</span>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {property.is_featured && <Badge variant="secondary">Рекомендуем</Badge>}
          {property.category && <Badge variant="primary">{property.category.name}</Badge>}
          <Badge variant={property.is_active ? 'success' : 'outline'}>
            {property.is_active ? 'Актуально' : 'В архиве'}
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{property.title}</h1>
        
        <div className="text-4xl font-bold text-primary mb-6">
          {formatPrice(property.price, property.currency)}
        </div>

        <div className="flex items-start text-slate-600 mb-8 text-lg gap-2">
          <MapPin className="w-6 h-6 shrink-0 mt-0.5 text-primary" />
          <span>{property.city}, {property.district ? `${property.district}, ` : ''}{property.address}</span>
        </div>

        {/* Characteristics Grid */}
        <h3 className="text-xl font-bold text-slate-900 mb-4">Характеристики</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
            <Maximize className="w-8 h-8 text-primary/60" />
            <div>
              <div className="text-sm text-slate-500">Площадь</div>
              <div className="font-semibold text-slate-900">{formatArea(property.area)}</div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
            <Bed className="w-8 h-8 text-primary/60" />
            <div>
              <div className="text-sm text-slate-500">Комнаты</div>
              <div className="font-semibold text-slate-900">{pluralize(property.rooms, ['комната', 'комнаты', 'комнат'])}</div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
            <Layers className="w-8 h-8 text-primary/60" />
            <div>
              <div className="text-sm text-slate-500">Этаж</div>
              <div className="font-semibold text-slate-900">
                {property.floor ? `${property.floor} из ${property.total_floors || '?'}` : '-'}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
            <Calendar className="w-8 h-8 text-primary/60" />
            <div>
              <div className="text-sm text-slate-500">Год постройки</div>
              <div className="font-semibold text-slate-900">{property.year_built || 'Не указан'}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Описание</h3>
          <div className="prose prose-slate max-w-none">
            {property.description.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4 text-slate-700 leading-relaxed">{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
