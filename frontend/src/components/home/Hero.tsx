import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';

export function Hero() {
  return (
    <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-primary-900">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-900/40 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80")' }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Найдите идеальную недвижимость с Estate
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-10 leading-relaxed max-w-2xl">
            Эксклюзивные предложения квартир, домов и коммерческой недвижимости. Мы поможем сделать правильный выбор.
          </p>
          
          <div className="bg-white p-2 rounded-lg flex flex-col md:flex-row gap-2 max-w-2xl shadow-xl">
            <input 
              type="text" 
              placeholder="Поиск по городу или адресу..." 
              className="flex-1 px-4 py-3 outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
            />
            <Link href="/properties" className="w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto flex items-center justify-center gap-2">
                <Search size={20} />
                Найти
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-8 text-white/80">
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm">Объектов в базе</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">10+</div>
              <div className="text-sm">Лет на рынке</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">98%</div>
              <div className="text-sm">Довольных клиентов</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
