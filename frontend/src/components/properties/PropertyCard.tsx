import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatArea, getStatusBadgeVariant } from '@/lib/utils';
import { MapPin, Bed, Maximize, Layers } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { localizeHref } from '@/i18n/config';
import { localizedCategoryName, localizedProperty, localizedStatus, roomLabel } from '@/i18n/domain';
import { siteCopy } from '@/i18n/siteCopy';
import { CurrencyPrice } from '@/components/currency/CurrencyPrice';

interface PropertyCardProps {
  property: Property;
  locale: Locale;
}

export function PropertyCard({ property: sourceProperty, locale }: PropertyCardProps) {
  const property = localizedProperty(sourceProperty, locale);
  const copy = siteCopy[locale].property;
  // Use first image or a gradient placeholder
  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : null;

  const rawStatus = property.status_badge ?? (property.is_active ? 'Актуально' : 'В архиве');
  const statusBadgeText = localizedStatus(locale, rawStatus);
  const statusBadgeVariant = getStatusBadgeVariant(rawStatus);
  const location = [property.city, property.district, property.address].filter(Boolean).join(', ');

  return (
    <Link href={localizeHref(locale, `/properties/${property.slug}`)} className="group block">
      <Card hoverable className="h-full flex flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-400">
              <span className="text-sm font-medium">{copy.noPhoto}</span>
            </div>
          )}
          
          <div className="absolute start-3.5 top-3.5 flex flex-wrap gap-1.5 z-10">
            {property.is_featured && (
              <Badge variant="secondary" className="shadow-md font-semibold">{copy.recommended}</Badge>
            )}
            {property.category && (
              <Badge variant="primary" className="shadow-md">{localizedCategoryName(locale, property.category.slug, property.category.name, property.category.translations)}</Badge>
            )}
          </div>

          {/* Status Badge in Top Right */}
          {statusBadgeText && (
            <div className="absolute end-3.5 top-3.5 z-10">
              <Badge variant={statusBadgeVariant} className="shadow-md bg-white/95 backdrop-blur-sm font-semibold">
                {statusBadgeText}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <div className="text-2xl font-bold text-primary mb-2">
            <CurrencyPrice amount={property.price} sourceCurrency={property.currency} locale={locale} />
          </div>
          
          <h3 dir="auto" className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          
          <div className="flex items-start text-slate-500 mb-4 text-sm gap-1.5 line-clamp-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span dir="auto">{location}</span>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
              <Bed className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium" dir="auto">{roomLabel(locale, property.rooms)}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-slate-600 gap-1 border-x border-slate-100">
              <Maximize className="w-4 h-4 text-primary-400" />
              <bdi dir="ltr" className="text-xs font-medium">{formatArea(property.area)}</bdi>
            </div>
            <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
              <Layers className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium" dir="auto">{property.floor ? `${property.floor} ${copy.floor.toLowerCase()}` : '—'}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
