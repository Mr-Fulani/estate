import type { Category, DevelopmentProfile, Property, PropertyFormData } from '@/types';
import type { Locale } from '@/i18n/config';

export const emptyDevelopment: DevelopmentProfile = { is_demo: false, developer: '', design_brand: '', price_date: null, price_status: 'indicative', images_are_renders: true, interior_images: [], translations: {} };
const clean = (values: string[]) => values.map(value => value.trim()).filter(Boolean);
export function isMediaUrl(value: string): boolean {
  if (value.includes('\\') || Array.from(value).some(character => character.charCodeAt(0) <= 32)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

/** The same cleaned payload drives saving and the unsaved preview. */
export function preparePropertyForm(data: PropertyFormData): PropertyFormData {
  const russian = data.translations?.find(item => item.locale === 'ru');
  const development = data.listing_kind === 'development' ? {
    ...emptyDevelopment, ...data.development,
    interior_images: clean(data.development?.interior_images || []),
    translations: Object.fromEntries(Object.entries(data.development?.translations || {}).map(([locale, copy]) => [locale, { ...copy, amenities: clean(copy.amenities) }])),
  } : null;
  return {
    ...data, development,
    is_featured: development?.is_demo ? false : data.is_featured,
    unit_types: data.listing_kind === 'development' ? data.unit_types?.map((unit, position) => {
      const plans = clean(unit.plans);
      return { ...unit, code: unit.code.trim(), position, plans, plan_details: unit.plan_details?.filter(detail => plans.includes(detail.image)) || [] };
    }) : [],
    title: russian?.title.trim() || data.title.trim(),
    description: russian?.description?.trim() || data.description?.trim() || '',
    translations: data.translations?.filter(item => item.locale === 'ru' || Object.entries(item).some(([key, value]) => key !== 'locale' && typeof value === 'string' && value.trim())).map(item => ({
      ...item, title: item.title.trim() || data.title.trim(), description: item.description?.trim() || '',
      city: item.city?.trim() || undefined, district: item.district?.trim() || undefined, address: item.address?.trim() || undefined,
      meta_title: item.meta_title?.trim() || undefined, meta_description: item.meta_description?.trim() || undefined, status_badge: item.status_badge?.trim() || undefined,
    })),
  };
}

export function buildDevelopmentPreview(data: PropertyFormData, categories: Category[]): Property {
  const payload = preparePropertyForm(data);
  const units = (payload.unit_types || []).map((unit, index) => ({ ...unit, code: unit.code || `Вариант ${index + 1}`, plans: unit.plans.filter(isMediaUrl) }));
  const prices = units.flatMap(unit => unit.price_min !== null && Number.isFinite(unit.price_min) && unit.price_min > 0 ? [unit.price_min] : []);
  const areas = units.flatMap(unit => unit.area_min !== null && Number.isFinite(unit.area_min) && unit.area_min > 0 ? [unit.area_min] : []);
  const profile = { ...emptyDevelopment, ...payload.development, interior_images: (payload.development?.interior_images || []).filter(isMediaUrl) };
  if (profile.brochure_url && !isMediaUrl(profile.brochure_url)) profile.brochure_url = null;
  if (profile.price_date && !Number.isFinite(Date.parse(profile.price_date))) profile.price_date = null;
  return {
    ...payload, id: 0, title: payload.title || 'Новый жилой комплекс', slug: payload.slug || 'preview', description: payload.description || '',
    price: prices.length ? Math.min(...prices) : 0, currency: payload.currency || 'RUB', area: areas.length ? Math.min(...areas) : 0, rooms: 0,
    address: payload.address || '', city: payload.city || '', district: payload.district || null,
    floor: null, total_floors: null, year_built: payload.year_built || null, is_active: false, is_featured: false,
    transaction_type: payload.transaction_type || 'sale', market_status: payload.market_status || 'available',
    images: (payload.images || []).filter(isMediaUrl), category: categories.find(category => category.id === payload.category_id) || null,
    listing_kind: 'development', development: profile, unit_types: units, created_at: '', updated_at: '',
  };
}

/** Section visibility and navigation must use the same source of truth. */
export function developmentSections(property: Property, locale: Locale) {
  const profile = property.development || emptyDevelopment;
  const editorial = profile.translations[locale] || profile.translations.en || profile.translations.ru;
  const interiors = clean(profile.interior_images);
  return {
    editorial, interiors, amenities: clean(editorial?.amenities || []),
    concept: Boolean(property.description?.trim() || editorial?.story?.trim() || profile.developer.trim() || profile.design_brand.trim()),
    residences: Boolean(property.unit_types?.length),
    location: Boolean([property.city, property.district, property.address, editorial?.location_description].some(value => value?.trim())),
  };
}
