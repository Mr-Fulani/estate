import Link from 'next/link';
import { 
  Home, 
  Key, 
  TrendingUp, 
  ShieldCheck, 
  Building2, 
  Scale, 
  CheckCircle2, 
  ArrowRight, 
  PhoneCall,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Услуги — Агентство недвижимости Estate',
  description: 'Полный комплекс риелторских и юридических услуг: покупка, продажа, аренда, исламская рассрочка и инвестиции в недвижимость.',
};

const mainServices = [
  {
    icon: Home,
    title: 'Покупка жилой недвижимости',
    tagline: 'Найдем квартиру или дом вашей мечты по лучшей цене',
    description: 'Мы берем на себя весь процесс: от анализа ваших пожеланий и организации просмотров до переговоров о скидке и безопасной передачи ключей.',
    features: [
      'Доступ к закрытым базам и предпродажным объектам',
      'Организация персональных просмотров в удобное время',
      'Профессиональные переговоры и аргументированный торг',
      'Безопасные расчеты через банковские ячейки или эскроу-счета',
    ],
  },
  {
    icon: Key,
    title: 'Продажа недвижимости',
    tagline: 'Продадим ваш объект быстро и по максимальной рыночной цене',
    description: 'Создадим продающую упаковку вашего объекта, запустим рекламу на всех ведущих площадках и найдем надежного покупателя в минимальные сроки.',
    features: [
      'Профессиональная фото- и видеосъемка интерьера',
      'Реклама на 30+ профильных порталах и в соцсетях',
      'Отбор платежеспособных покупателей без пустых показов',
      'Полная юридическая поддержка сделки',
    ],
  },
  {
    icon: Building2,
    title: 'Аренда и управление недвижимостью',
    tagline: 'Стабильный пассивный доход без хлопот и рисков',
    description: 'Подберем надежных арендаторов, составим договор с защитой ваших интересов и обеспечим контроль за сохранностью имущества и своевременной оплатой.',
    features: [
      'Тщательная проверка благонадежности нанимателей',
      'Грамотный договор найма с актом приема-передачи',
      'Доверительное управление под ключ',
      'Страхование отделки и ответственности перед соседями',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Инвестиции в недвижимость',
    tagline: 'Высокая доходность и надежная защита вашего капитала',
    description: 'Формируем инвестиционные портфели с доходностью от 15% до 30% годовых: покупка на старте продаж, флиппинг, доходные апартаменты и коммерция.',
    features: [
      'Расчет окупаемости и финансовой модели',
      'Аналитика локаций и потенциала роста цен',
      'Покупка лотов по закрытым спецпредложениям застройщиков',
      'Помощь в последующей перепродаже или сдаче в аренду',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Юридическое сопровождение и безопасность',
    tagline: '100% юридическая чистота каждой сделки',
    description: 'Глубокий аудит истории объекта, проверка собственников, выявление скрытых обременений и рисков банкротства.',
    features: [
      'Проверка по 25+ базам данных и реестрам',
      'Письменное заключение юридической службы',
      'Сопровождение расчетов и подписания документов',
      'Защита интересов клиента в любых инстанциях',
    ],
  },
  {
    icon: Scale,
    title: 'Рассрочка по исламским стандартам (Халяль)',
    tagline: 'Честная покупка недвижимости без процентов и переплат',
    description: 'Приобретение квартир, домов и коммерции по нормам Шариата (Мурабаха и партнерские исламские программы). Фиксированная цена, отсутствие штрафов и прозрачные условия договора.',
    features: [
      '0% скрытых процентов, пеней и штрафов (без риба)',
      'Фиксированная стоимость договора на весь период выплат',
      'Полное соответствие нормам Шариата и стандартам AAOIFI',
      'Гибкий график платежей и комфортный первоначальный взнос',
    ],
  },
];

const workSteps = [
  {
    step: '01',
    title: 'Первичная консультация',
    desc: 'Обсуждаем ваши цели, требования, бюджет и определяем оптимальную стратегию.',
  },
  {
    step: '02',
    title: 'Подбор и детальный анализ',
    desc: 'Формируем шорт-лист лучших вариантов или готовим объект к эффективной продаже.',
  },
  {
    step: '03',
    title: 'Юридический аудит',
    desc: 'Проверяем документы, подготавливаем безопасный договор и схему расчетов.',
  },
  {
    step: '04',
    title: 'Проведение сделки',
    desc: 'Контролируем регистрацию перехода прав, безопасную передачу денег и ключей.',
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-primary-900 py-20 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-secondary text-sm font-semibold tracking-wide uppercase mb-4 backdrop-blur-sm">
              Услуги агентства
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Комплексные решения в сфере недвижимости
            </h1>
            <p className="text-xl text-primary-100 leading-relaxed mb-8">
              Решаем любые задачи с жилой и коммерческой недвижимостью: от первой консультации до вручения ключей и регистрации прав.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Получить бесплатную консультацию
                </Button>
              </Link>
              <Link href="/properties">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 hover:text-white">
                  Смотреть объекты
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-slate-100 bg-slate-50 py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">10+ лет надежности</h4>
                <p className="text-sm text-slate-600">Безупречная репутация на рынке</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Экономия вашего времени</h4>
                <p className="text-sm text-slate-600">Берем на себя всю рутину и бумажную работу</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Финансовая безопасность</h4>
                <p className="text-sm text-slate-600">Страхование профессиональной ответственности</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Наши ключевые направления
            </h2>
            <p className="text-lg text-slate-600">
              Индивидуальный подход к каждому клиенту и гарантированный результат в оговоренные сроки.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mainServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">{service.title}</h3>
                        <p className="text-sm font-medium text-secondary-600">{service.tagline}</p>
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed mb-6">
                      {service.description}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {service.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-3 text-slate-700">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 font-semibold text-primary hover:text-secondary transition-colors"
                    >
                      Заказать услугу
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Прозрачный процесс</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4">
              Как мы работаем
            </h2>
            <p className="text-lg text-slate-600">
              Понятные и отлаженные этапы взаимодействия для вашего комфорта и спокойствия.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workSteps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 relative">
                <span className="text-5xl font-black text-slate-200 block mb-4">
                  {step.step}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <PhoneCall className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Нужна индивидуальная консультация?</h2>
          <p className="text-lg text-primary-100 mb-8 leading-relaxed">
            Оставьте заявку прямо сейчас, и наш эксперт свяжется с вами в течение 15 минут для подробного разбора вашей ситуации.
          </p>
          <Link href="/contact">
            <Button size="lg" variant="secondary" className="font-semibold text-base px-8 py-4">
              Связаться со специалистом
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
