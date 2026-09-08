import type { Property } from '@/types';
import type { Locale } from '@/i18n/config';
import { fetchProperties } from '@/lib/api';
import { hasPropertyLocale } from '@/i18n/domain';
import { PropertyGrid } from './PropertyGrid';

export async function RelatedProperties({ property, locale, title }: { property: Property; locale: Locale; title: string }) {
  const result = await fetchProperties({ category_id: property.category_id, transaction_type: property.transaction_type, per_page: 12 });
  const items = result.items.filter(item => item.id !== property.id && item.market_status !== 'archived' && !item.development?.is_demo && hasPropertyLocale(item, locale)).slice(0, 3);
  if (!items.length) return null;
  return <section className="mt-12"><h2 className="mb-6 text-2xl font-bold">{title}</h2><PropertyGrid properties={items} locale={locale} /></section>;
}
