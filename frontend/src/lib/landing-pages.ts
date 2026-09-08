import type { Locale } from '@/i18n/config';

export interface LandingTranslation {title: string; description: string; content: string; meta_title: string;}
export interface LandingPage {
  id?: number; slug: string; is_published: boolean; updated_at?: string;
  filters: {category_id?: number | null; city?: string | null; transaction_type?: 'sale'|'rent'|null};
  translations: Partial<Record<Locale, LandingTranslation>>;
}
export function landingLocales(page: LandingPage, active: readonly Locale[]): Locale[] {
  return active.filter(locale=>{
    const copy=page.translations[locale];
    return Boolean(copy?.title.trim() && copy.description.trim() && copy.content.trim());
  });
}
export const collectionsLabel = {ru:'Подборки недвижимости',en:'Property collections',tr:'Gayrimenkul seçkileri',ar:'مجموعات العقارات'};
