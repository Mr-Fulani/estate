import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Елена Смирнова',
    role: 'Покупатель квартиры',
    content: 'Огромное спасибо команде Estate за помощь в покупке нашей первой квартиры. Все прошло быстро, профессионально и без лишних нервов. Юристы проверили все документы от и до.',
    initial: 'Е'
  },
  {
    name: 'Михаил Иванов',
    role: 'Инвестор',
    content: 'Сотрудничаю с агентством уже более трех лет. Ребята отлично знают рынок, всегда предлагают ликвидные объекты. Отдельное спасибо за управление моей недвижимостью.',
    initial: 'М'
  },
  {
    name: 'Анна Новикова',
    role: 'Продавец дома',
    content: 'Нужно было срочно продать загородный дом. Обратилась в Estate и не пожалела. Нашли покупателя за две недели, помогли с оформлением всех бумаг. Рекомендую!',
    initial: 'А'
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Отзывы клиентов</h2>
          <p className="text-lg text-slate-600">
            Узнайте, что говорят о нас люди, которые уже воспользовались нашими услугами.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative">
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              <p className="text-slate-600 mb-6 relative z-10 leading-relaxed italic">
                "{t.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {t.initial}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
