import { fetchFeaturedProperties } from '@/lib/api';
import { PropertyGrid } from '../properties/PropertyGrid';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

export async function FeaturedProperties() {
  const properties = await fetchFeaturedProperties();

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Рекомендуемые объекты
            </h2>
            <p className="text-lg text-slate-600">
              Ознакомьтесь с нашими лучшими предложениями, отобранными экспертами Estate.
            </p>
          </div>
          <Link href="/properties">
            <Button variant="outline" className="group flex items-center gap-2">
              Смотреть все
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <PropertyGrid properties={properties} />
      </div>
    </section>
  );
}
