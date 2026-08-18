import Link from 'next/link';
import { Search, Building, Shield, Users } from 'lucide-react';
import { Button } from '../ui/Button';

export function Hero() {
  return (
    <div className="relative py-16 md:py-24 overflow-hidden bg-primary-900">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-900/80 to-primary-900/50 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80")' }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 text-secondary text-sm font-semibold tracking-wide uppercase mb-4 backdrop-blur-sm">
            Агентство премиальной недвижимости
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Найдите идеальную недвижимость с Estate
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed max-w-2xl">
            Эксклюзивные предложения квартир, домов и коммерческой недвижимости. Мы поможем сделать правильный выбор и проведем сделку под ключ.
          </p>
          
          <div className="bg-white p-2.5 rounded-2xl flex flex-col sm:flex-row gap-2 max-w-2xl shadow-2xl border border-white/20">
            <input 
              type="text" 
              placeholder="Поиск по городу, району или названию..." 
              className="flex-1 px-4 py-3 outline-none text-slate-800 placeholder:text-slate-400 bg-transparent text-sm md:text-base font-medium"
            />
            <Link href="/properties" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl">
                <Search size={18} />
                Найти объект
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 text-white/90 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-secondary backdrop-blur-sm">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">500+</div>
                <div className="text-xs text-primary-200">Объектов в базе</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-secondary backdrop-blur-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">10+</div>
                <div className="text-xs text-primary-200">Лет опыта</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-secondary backdrop-blur-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-bold text-white">1000+</div>
                <div className="text-xs text-primary-200">Клиентов</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
