'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Building, Building2, Home, Briefcase, Palmtree, type LucideIcon } from 'lucide-react';
import { Category } from '@/types';
import { useLocale } from '@/context/LocaleContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { getSiteCopy } from '@/lib/site-profile';
import { localizedCategoryNavigationName } from '@/i18n/domain';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPrice } from '@/lib/utils';
import { startNavigationFeedback } from '@/components/layout/NavigationFeedback';

const categoryIcons: Record<string, LucideIcon> = {
  kvartira: Building,
  dom: Home,
  'residential-development': Building2,
  kommerciya: Briefcase,
  villy: Palmtree,
  villa: Palmtree,
};

export function HeroSearch({ categories = [] }: { categories: Category[] }) {
  const { settings: siteSettings } = useSiteSettings();
  const router = useRouter();
  const { locale, href } = useLocale();
  const copy = getSiteCopy(locale, siteSettings).home.search;
  const { currency, convert } = useCurrency();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const budgetLabel = (amount: number) => {
    const formatted = formatPrice(convert(amount, 'RUB', currency), currency, locale);
    if (locale === 'en') return `up to ${formatted}`;
    if (locale === 'tr') return `En fazla ${formatted}`;
    if (locale === 'ar') return `حتى ${formatted}`;
    return `до ${formatted}`;
  };

  const quickCategories = [['kvartira'], ['dom'], ['residential-development'], ['kommerciya'], ['villa', 'villy']]
    .flatMap(slugs => categories.filter(category => slugs.includes(category.slug)).slice(0, 1));

  const searchHref = (categoryId?: number) => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    if (categoryId) {
      params.append('category_id', String(categoryId));
    }
    if (maxPrice) {
      params.append('max_price', maxPrice);
    }

    const queryString = params.toString();
    return queryString ? `${href('/properties')}?${queryString}` : href('/properties');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startNavigationFeedback();
    router.push(searchHref());
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Category Tabs */}
      <nav aria-label={getSiteCopy(locale, siteSettings).catalog.category} className="home-category-nav flex w-full flex-nowrap gap-1 overflow-x-auto rounded-2xl border border-white/15 bg-white/10 p-1 mb-3 backdrop-blur-md">
        <Link
          href={searchHref()}
          className="shrink-0 whitespace-nowrap rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-primary shadow-md transition-colors"
        >
          {copy.all}
        </Link>

        {quickCategories.map((cat) => {
          const Icon = categoryIcons[cat.slug] || Building;
          return (
            <Link
              key={cat.id}
              href={searchHref(cat.id)}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-secondary"
            >
              <Icon className="w-3.5 h-3.5" />
              {localizedCategoryNavigationName(locale, cat.slug, cat.name, cat.translations)}
            </Link>
          );
        })}
      </nav>

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
            placeholder={copy.placeholder}
            aria-label={copy.placeholder}
            className="w-full py-2.5 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm md:text-base font-medium outline-none"
          />
        </div>

        {/* Max Price quick selector */}
        <div className="md:w-48 flex items-center px-3 py-1 bg-slate-50 rounded-xl border border-slate-200/80 focus-within:border-primary focus-within:bg-white transition-all">
          <select
            aria-label={copy.budget}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full py-2.5 bg-transparent text-slate-800 text-sm font-medium outline-none cursor-pointer"
          >
            <option value="">{copy.budget}</option>
            <option value="10000000">{budgetLabel(10_000_000)}</option>
            <option value="20000000">{budgetLabel(20_000_000)}</option>
            <option value="50000000">{budgetLabel(50_000_000)}</option>
            <option value="100000000">{budgetLabel(100_000_000)}</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-primary hover:bg-primary-800 text-white font-semibold px-6 py-3.5 rounded-xl text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>{copy.submit}</span>
        </button>
      </form>
    </div>
  );
}
