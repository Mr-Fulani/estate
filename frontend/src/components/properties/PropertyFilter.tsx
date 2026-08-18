'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/types';
import { fetchCategories } from '@/lib/api';
import { Search, RotateCcw, SlidersHorizontal, Building2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PropertyFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);

  const [filters, setFilters] = useState({
    category_id: searchParams.get('category_id') || '',
    city: searchParams.get('city') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    rooms: searchParams.get('rooms') || '',
    min_area: searchParams.get('min_area') || '',
    max_area: searchParams.get('max_area') || '',
  });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // Sync state with URL if URL changes
  useEffect(() => {
    setFilters({
      category_id: searchParams.get('category_id') || '',
      city: searchParams.get('city') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      rooms: searchParams.get('rooms') || '',
      min_area: searchParams.get('min_area') || '',
      max_area: searchParams.get('max_area') || '',
    });
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRooms = (val: string) => {
    setFilters((prev) => ({ ...prev, rooms: prev.rooms === val ? '' : val }));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    router.push(`/properties?${params.toString()}`);
  };

  const handleReset = () => {
    setFilters({
      category_id: '',
      city: '',
      min_price: '',
      max_price: '',
      rooms: '',
      min_area: '',
      max_area: '',
    });
    router.push('/properties');
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200">
      {/* Filter Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Фильтры</h3>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Сбросить
          </button>
        )}
      </div>

      <form onSubmit={handleApply} className="flex flex-col gap-5">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Тип объекта
          </label>
          <div className="relative">
            <select
              name="category_id"
              value={filters.category_id}
              onChange={handleChange}
              className="w-full h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-8 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* City / Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Город / Район
          </label>
          <div className="relative">
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleChange}
              placeholder="Москва, Подмосковье..."
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 pl-9 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Стоимость (₽)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="min_price"
              value={filters.min_price}
              onChange={handleChange}
              placeholder="От"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleChange}
              placeholder="До"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Rooms */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Комнаты
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['1', '2', '3', '4+'].map((val) => {
              const filterVal = val === '4+' ? '4' : val;
              const isSelected = filters.rooms === filterVal;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => toggleRooms(filterVal)}
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
            Площадь (м²)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="min_area"
              value={filters.min_area}
              onChange={handleChange}
              placeholder="От м²"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <input
              type="number"
              name="max_area"
              value={filters.max_area}
              onChange={handleChange}
              placeholder="До м²"
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
            Показать результаты
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-10 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 hover:bg-slate-200 hover:text-slate-900 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сбросить фильтры
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
