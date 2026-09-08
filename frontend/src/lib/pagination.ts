import { notFound } from 'next/navigation';

export type SearchQuery = Record<string, string | string[] | undefined>;

/** Reject ambiguous, fractional and non-canonical page numbers before querying the API. */
export function paginationPage(value: string | string[] | undefined): number {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) notFound();
  const page = Number(value);
  if (!Number.isSafeInteger(page) || page > 2147483647) notFound();
  return page;
}

export function assertPageExists(page: number, total: number, perPage: number): void {
  if (page > Math.max(1, Math.ceil(total / perPage))) notFound();
}

export function propertyQuery(query: SearchQuery) {
  const params: Record<string, string | number> = { page: paginationPage(query.page), per_page: 12 };
  for (const key of ['search', 'city']) {
    const value = query[key];
    if (Array.isArray(value)) notFound();
    if (value) params[key] = value;
  }
  for (const key of ['category_id', 'min_price', 'max_price', 'rooms', 'min_rooms', 'min_area', 'max_area']) {
    const value = query[key];
    if (value === undefined || value === '') continue;
    if (Array.isArray(value) || !Number.isFinite(Number(value)) || Number(value) < 0) notFound();
    if (['category_id', 'rooms', 'min_rooms'].includes(key) && !Number.isInteger(Number(value))) notFound();
    if (key === 'category_id' && Number(value) < 1) notFound();
    params[key] = Number(value);
  }
  return params;
}
