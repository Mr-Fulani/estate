import type { SearchQuery } from '@/lib/pagination';

export function privateQuery(query: SearchQuery): boolean {
  return ['token', 'preview'].some(key => Object.hasOwn(query, key));
}

export function indexableQuery(query: SearchQuery): boolean {
  if (privateQuery(query)) return false;
  return Object.entries(query).every(([key, value]) => value === undefined || value === ''
    || key === 'page' || key.startsWith('utm_')
    || ['gclid', 'dclid', 'fbclid', 'msclkid', 'yclid', '_gl'].includes(key));
}
