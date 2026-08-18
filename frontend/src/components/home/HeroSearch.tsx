'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building, Home, Trees, Briefcase, SlidersHorizontal } from 'lucide-react';
import { Category } from '@/types';
import { fetchCategories } from '@/lib/api';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, any> = {
  kvartira: Building,
  dom: Home,
  uchastok: Trees,
  kommerciya: Briefcase,
};

export function HeroSearch() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    if (selectedCategory) {
      params.append('category_id', selectedCategory);
    }
    if (maxPrice) {
      params.append('max_price', maxPrice);
    }

    const queryString = params.toString();
    router.push(queryString ? `/properties?${queryString}` : '/properties');
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-white/10 backdrop-blur-md rounded-2xl w-fit mb-3 border border-white/15">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all',
            selectedCategory === ''
              ? 'bg-white text-primary shadow-md'
              : 'text-white/90 hover:text-white hover:bg-white/10'
          )}
        >
          Все объекты
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === String(cat.id);
          const Icon = categoryIcons[cat.slug] || Building;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(String(cat.id))}
              className={cn(
                'px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5',
                isSelected
                  ? 'bg-white text-primary shadow-md'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Main Search Bar Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white p-2.5 md:p-3 rounded-2xl shadow-2xl border border-white/30 flex flex-col md:flex-row gap-2.5"
      >
        {/* Search Query Input */}
        <div className="flex-1 flex items-center gap-2.5 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200/80 focus-within:border-primary focus-within:bg-white transition-all">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Город, район, улица или ключевое слово..."
            className="w-full py-2.5 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm md:text-base font-medium outline-none"
          />
        </div>

        {/* Max Price quick selector */}
        <div className="md:w-48 flex items-center px-3 py-1 bg-slate-50 rounded-xl border border-slate-200/80 focus-within:border-primary focus-within:bg-white transition-all">
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full py-2.5 bg-transparent text-slate-800 text-sm font-medium outline-none cursor-pointer"
          >
            <option value="">Бюджет: Любой</option>
            <option value="10000000">до 10 млн ₽</option>
            <option value="20000000">до 20 млн ₽</option>
            <option value="50000000">до 50 млн ₽</option>
            <option value="100000000">до 100 млн ₽</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-primary hover:bg-primary-800 text-white font-semibold px-6 py-3.5 rounded-xl text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>Найти</span>
        </button>
      </form>
    </div>
  );
}
