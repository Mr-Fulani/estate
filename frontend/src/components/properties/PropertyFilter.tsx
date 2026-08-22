'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/types';
import { Search, RotateCcw, SlidersHorizontal, Building2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { siteCopy } from '@/i18n/siteCopy';
import { localizedCategoryName } from '@/i18n/domain';
import { useCurrency } from '@/context/CurrencyContext';
import { startNavigationFeedback } from '@/components/layout/NavigationFeedback';

export function PropertyFilter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { locale, href } = useLocale();
  const copy = siteCopy[locale].catalog;
  const { currency, convert } = useCurrency();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const displayPrice = useCallback((value: string) => value
    ? String(Math.round(convert(Number(value), 'RUB', currency)))
    : '', [convert, currency]);

  const rublePrice = useCallback((value: string) => value
    ? String(Math.round(convert(Number(value), currency, 'RUB')))
    : '', [convert, currency]);

  const priceLabel = `${copy.price.replace(/\s*\([^)]*\)\s*$/, '')} (${currency})`;

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    city: searchParams.get('city') || '',
    min_price: displayPrice(searchParams.get('min_price') || ''),
    max_price: displayPrice(searchParams.get('max_price') || ''),
    rooms: searchParams.get('rooms') || '',
    min_rooms: searchParams.get('min_rooms') || '',
    min_area: searchParams.get('min_area') || '',
    max_area: searchParams.get('max_area') || '',
  });

  // Sync state with URL if URL changes
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category_id: searchParams.get('category_id') || '',
      city: searchParams.get('city') || '',
      min_price: displayPrice(searchParams.get('min_price') || ''),
      max_price: displayPrice(searchParams.get('max_price') || ''),
      rooms: searchParams.get('rooms') || '',
      min_rooms: searchParams.get('min_rooms') || '',
      min_area: searchParams.get('min_area') || '',
      max_area: searchParams.get('max_area') || '',
    });
  }, [searchParams, displayPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRooms = (val: string) => {
    setFilters((prev) => val === '4+'
      ? { ...prev, rooms: '', min_rooms: prev.min_rooms === '4' ? '' : '4' }
      : { ...prev, rooms: prev.rooms === val ? '' : val, min_rooms: '' });
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, key === 'min_price' || key === 'max_price' ? rublePrice(value) : value);
      }
    });
    const queryString = params.toString();
    setIsMobileOpen(false);
    startNavigationFeedback();
    router.push(queryString ? `${href('/properties')}?${queryString}` : href('/properties'));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      category_id: '',
      city: '',
      min_price: '',
      max_price: '',
      rooms: '',
      min_rooms: '',
      min_area: '',
      max_area: '',
    });
    startNavigationFeedback();
    router.push(href('/properties'));
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen((open) => !open)}
        className="mb-4 flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-800 shadow-sm lg:hidden"
        aria-expanded={isMobileOpen}
        aria-controls="property-filter-panel"
      >
        <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" />{copy.filters}</span>
        {activeFilterCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>}
      </button>
      <div id="property-filter-panel" className={cn('bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200', !isMobileOpen && 'hidden lg:block')}>
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">{copy.filters}</h3>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            {copy.reset}
          </button>
        )}
      </div>

      <form onSubmit={handleApply} className="flex flex-col gap-5">
        {/* Search Keyword */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {copy.keyword}
          </label>
          <div className="relative">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder={copy.keywordPlaceholder}
              aria-label={copy.keyword}
              dir="auto"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 ps-9 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {copy.category}
          </label>
          <div className="relative">
            <select
              name="category_id"
              value={filters.category_id}
              onChange={handleChange}
              className="w-full h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 pe-8 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="">{copy.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {localizedCategoryName(locale, c.slug, c.name, c.translations)}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* City / Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {copy.location}
          </label>
          <div className="relative">
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder={copy.locationPlaceholder}
              aria-label={copy.location}
              dir="auto"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 ps-9 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {priceLabel}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="min_price"
              value={filters.min_price}
              onChange={handleChange}
              placeholder={copy.from}
              aria-label={`${priceLabel}: ${copy.from}`}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleChange}
              placeholder={copy.to}
              aria-label={`${priceLabel}: ${copy.to}`}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Rooms */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {copy.rooms}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['1', '2', '3', '4+'].map((val) => {
              const isSelected = val === '4+' ? filters.min_rooms === '4' : filters.rooms === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => toggleRooms(val)}
                  aria-pressed={isSelected}
                  className={cn(
                    'h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center border',
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  )}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Area Range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {copy.area}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="min_area"
              value={filters.min_area}
              onChange={handleChange}
              placeholder={copy.from}
              aria-label={`${copy.area}: ${copy.from}`}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <input
              type="number"
              name="max_area"
              value={filters.max_area}
              onChange={handleChange}
              placeholder={copy.to}
              aria-label={`${copy.area}: ${copy.to}`}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 mt-1">
          <button
            type="submit"
            className="w-full h-11 bg-primary text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-800 active:scale-[0.99] transition-all shadow-sm"
          >
            <Search className="w-4 h-4" />
            {copy.apply}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-10 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {copy.reset}
            </button>
          )}
        </div>
      </form>
      </div>
    </>
  );
}
