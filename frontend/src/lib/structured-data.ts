import type { Category, NewsArticle, SiteSettings } from '@/types';

export function propertySchemaType(category?: Category | null): string {
  return category?.schema_type || 'Place';
}

export function articleAuthor(article: NewsArticle, settings: SiteSettings, origin: string) {
  if (!article.author?.trim()) return settings.profile?.brand_name ? {'@id': `${origin}/#organization`} : undefined;
  return {'@type':article.author_type || 'Organization',name:article.author,url:article.author_url ? new URL(article.author_url,origin).toString() : undefined};
}
