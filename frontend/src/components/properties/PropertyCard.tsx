import Link from 'next/link';
import { Property } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatPrice, formatArea, pluralize, getStatusBadgeVariant } from '@/lib/utils';
import { MapPin, Bed, Maximize, Layers } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  // Use first image or a gradient placeholder
  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : null;

  const statusBadgeText = property.status_badge || (property.is_active ? 'Актуально' : 'В архиве');
  const statusBadgeVariant = getStatusBadgeVariant(statusBadgeText);

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <Card hoverable className="h-full flex flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={property.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-400">
              <span className="text-sm font-medium">Нет фото</span>
            </div>
          )}
          
          <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
            {property.is_featured && (
              <Badge variant="secondary" className="shadow-md font-semibold">Рекомендуем</Badge>
            )}
            {property.category && (
              <Badge variant="primary" className="shadow-md">{property.category.name}</Badge>
            )}
          </div>

          {/* Status Badge in Top Right */}
          {statusBadgeText && (
            <div className="absolute top-3.5 right-3.5 z-10">
              <Badge variant={statusBadgeVariant} className="shadow-md bg-white/95 backdrop-blur-sm font-semibold">
                {statusBadgeText}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <div className="text-2xl font-bold text-primary mb-2">
            {formatPrice(property.price, property.currency)}
          </div>
          
          <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          
          <div className="flex items-start text-slate-500 mb-4 text-sm gap-1.5 line-clamp-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{property.city}, {property.district ? `${property.district}, ` : ''}{property.address}</span>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
              <Bed className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium">{pluralize(property.rooms, ['комната', 'комнаты', 'комнат'])}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-slate-600 gap-1 border-x border-slate-100">
              <Maximize className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium">{formatArea(property.area)}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
              <Layers className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium">{property.floor ? `${property.floor} этаж` : '-'}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
