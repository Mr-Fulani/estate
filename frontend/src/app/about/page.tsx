import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-primary-900 py-20 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">О компании Estate</h1>
          <p className="text-xl text-primary-100 max-w-3xl leading-relaxed">
            Мы — команда профессионалов, влюбленных в недвижимость. С 2010 года мы помогаем людям находить дом мечты и выгодно инвестировать средства.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <div className="text-center p-6 bg-slate-50 rounded-2xl">
            <div className="text-4xl font-bold text-primary mb-2">10+</div>
            <div className="text-slate-600 font-medium">Лет опыта</div>
          </div>
          <div className="text-center p-6 bg-slate-50 rounded-2xl">
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-slate-600 font-medium">Объектов в базе</div>
          </div>
          <div className="text-center p-6 bg-slate-50 rounded-2xl">
            <div className="text-4xl font-bold text-primary mb-2">1000+</div>
            <div className="text-slate-600 font-medium">Довольных клиентов</div>
          </div>
          <div className="text-center p-6 bg-slate-50 rounded-2xl">
            <div className="text-4xl font-bold text-primary mb-2">25</div>
            <div className="text-slate-600 font-medium">Экспертов в штате</div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Наш подход к работе</h2>
            <div className="prose prose-lg text-slate-600">
              <p>
                В Estate мы верим, что покупка или продажа недвижимости — это не просто сделка, а важный жизненный этап для каждого нашего клиента. Именно поэтому мы строим свою работу на принципах прозрачности, честности и высочайшего профессионализма.
              </p>
              <p>
                Наши юристы досконально проверяют каждый объект, а агенты знают рынок как свои пять пальцев. Мы сопровождаем вас от первого звонка до получения ключей, беря на себя все бюрократические хлопоты.
              </p>
            </div>
          </div>
          <div className="aspect-[4/3] bg-slate-200 rounded-2xl overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80" 
              alt="Офис компании" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Наша команда руководителей</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Александр Петров', role: 'Генеральный директор', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80' },
              { name: 'Мария Сидорова', role: 'Руководитель отдела продаж', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80' },
              { name: 'Игорь Васильев', role: 'Главный юрист', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80' }
            ].map((member, i) => (
              <div key={i} className="text-center">
                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden mb-6 border-4 border-slate-50">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-primary font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
