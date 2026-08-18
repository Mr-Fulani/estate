'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/types';
import { fetchCategories } from '@/lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Search, X } from 'lucide-react';
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
    });
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const setRooms = (val: string) => {
    setFilters(prev => ({ ...prev, rooms: prev.rooms === val ? '' : val }));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
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
    });
    router.push('/properties');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <form onSubmit={handleApply} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Тип недвижимости</label>
            <select
              name="category_id"
              value={filters.category_id}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Все типы</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Город"
            name="city"
            value={filters.city}
            onChange={handleChange}
            placeholder="Например: Москва"
          />

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-medium text-slate-700">Цена (₽)</label>
            <div className="flex items-center gap-2">
              <Input
                name="min_price"
                type="number"
                value={filters.min_price}
                onChange={handleChange}
                placeholder="От"
                className="w-full"
              />
              <span className="text-slate-400">-</span>
              <Input
                name="max_price"
                type="number"
                value={filters.max_price}
                onChange={handleChange}
                placeholder="До"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Количество комнат</label>
          <div className="flex flex-wrap gap-2">
            {['1', '2', '3', '4+'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setRooms(val === '4+' ? '4' : val)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium border transition-colors",
                  filters.rooms === (val === '4+' ? '4' : val)
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-700 border-slate-300 hover:border-primary"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <Button type="submit" className="flex-1 md:flex-none flex items-center gap-2">
            <Search size={18} />
            Показать результаты
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className="flex-1 md:flex-none flex items-center gap-2">
            <X size={18} />
            Сбросить
          </Button>
        </div>
      </form>
    </div>
  );
}
