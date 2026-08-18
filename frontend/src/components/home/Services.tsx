import { Home, Key, TrendingUp, ShieldCheck } from 'lucide-react';

const services = [
  {
    icon: Home,
    title: 'Покупка недвижимости',
    description: 'Полное сопровождение сделки от подбора вариантов до получения ключей.'
  },
  {
    icon: Key,
    title: 'Продажа объектов',
    description: 'Эффективный маркетинг и быстрый поиск покупателей на вашу недвижимость.'
  },
  {
    icon: TrendingUp,
    title: 'Инвестиции',
    description: 'Подбор высокодоходных объектов для инвестирования и сдачи в аренду.'
  },
  {
    icon: ShieldCheck,
    title: 'Юридическое сопровождение',
    description: 'Проверка чистоты объектов и безопасное проведение сделок любой сложности.'
  }
];

export function Services() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Наши услуги</h2>
          <p className="text-lg text-slate-600">
            Мы предоставляем полный спектр услуг на рынке недвижимости, гарантируя надежность и профессионализм.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 hover:bg-primary hover:text-white transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 group-hover:bg-primary-800 transition-colors">
                  <Icon className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-white">
                  {service.title}
                </h3>
                <p className="text-slate-600 leading-relaxed group-hover:text-primary-100">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
