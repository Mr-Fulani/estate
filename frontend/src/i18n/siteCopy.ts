import type { Locale } from './config';
import { arabicSiteCopy } from './siteCopyAr';


type ServiceItem = { title: string; description: string };
type Testimonial = { name: string; role: string; content: string; initial: string };

export type SiteCopy = {
  home: {
    eyebrow: string;
    title: string;
    description: string;
    stats: [string, string, string];
    search: {
      all: string;
      placeholder: string;
      budget: string;
      budgets: [string, string, string, string];
      submit: string;
    };
    featuredTitle: string;
    featuredDescription: string;
    viewAll: string;
    servicesTitle: string;
    servicesDescription: string;
    services: ServiceItem[];
    testimonialsTitle: string;
    testimonialsDescription: string;
    testimonials: Testimonial[];
    ctaTitle: string;
    ctaDescription: string;
    consultation: string;
    catalog: string;
    converter: {
      eyebrow: string;
      title: string;
      description: string;
      amount: string;
      result: string;
      swap: string;
      live: string;
      cached: string;
      loading: string;
      unavailable: string;
      rate: string;
      updated: string;
      disclaimer: string;
      official: string;
      automatic: string;
    };
  };
  catalog: {
    title: string;
    description: string;
    found: string;
    empty: string;
    filters: string;
    reset: string;
    keyword: string;
    keywordPlaceholder: string;
    category: string;
    allCategories: string;
    location: string;
    locationPlaceholder: string;
    price: string;
    from: string;
    to: string;
    rooms: string;
    area: string;
    apply: string;
  };
  property: {
    back: string;
    fallbackNotice: string;
    interested: string;
    interestedDescription: string;
    recommended: string;
    actual: string;
    archived: string;
    area: string;
    rooms: string;
    floor: string;
    year: string;
    parameters: string;
    description: string;
    noDescription: string;
    freePlan: string;
    unspecified: string;
    noPhoto: string;
    photosSoon: string;
    photo: string;
    mainPhoto: string;
    enlarge: string;
    previousPhoto: string;
    nextPhoto: string;
    close: string;
    quickContact: string;
    whatsapp: string;
    telegram: string;
    call: string;
  };
  form: {
    name: string;
    namePlaceholder: string;
    phone: string;
    email: string;
    message: string;
    messagePlaceholder: string;
    propertyMessage: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successDescription: string;
    error: string;
  };
  contact: {
    title: string;
    description: string;
    info: string;
    office: string;
    phone: string;
    email: string;
    hours: string;
    social: string;
    write: string;
    responseTime: string;
  };
  about: {
    title: string;
    intro: string;
    stats: [string, string, string, string];
    approachTitle: string;
    paragraphs: [string, string];
    teamTitle: string;
    roles: [string, string, string];
  };
  services: {
    eyebrow: string;
    title: string;
    description: string;
    consultation: string;
    properties: string;
    trust: [string, string, string];
    sectionTitle: string;
    sectionDescription: string;
    items: Array<{ title: string; description: string; features: string[] }>;
    processTitle: string;
    process: Array<{ title: string; description: string }>;
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
  };
  news: {
    eyebrow: string;
    title: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    readMore: string;
    allArticles: string;
    empty: string;
    back: string;
    by: string;
    previous: string;
    next: string;
    page: string;
    fallbackNotice: string;
    imageAlt: string;
    mediaTitle: string;
    photo: string;
    video: string;
    openImage: string;
    previousImage: string;
    nextImage: string;
    closeMedia: string;
  };
  reviews: {
    title: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    leaveTitle: string;
    leaveDescription: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    rating: string;
    content: string;
    consent: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successDescription: string;
    error: string;
    verified: string;
    companyResponse: string;
    empty: string;
    invitationInvalid: string;
    viewAll: string;
    leaveReview: string;
  };
  footer: {
    description: string;
    navigation: string;
    catalog: string;
    company: string;
    services: string;
    contact: string;
    news: string;
    reviews: string;
    admin: string;
    copyright: string;
    privacy: string;
    terms: string;
  };
};


export const siteCopy: Record<Locale, SiteCopy> = {
  ru: {
    home: {
      eyebrow: 'Агентство премиальной недвижимости',
      title: 'Найдите идеальную недвижимость с Rahat Home',
      description: 'Эксклюзивные предложения квартир, домов и коммерческой недвижимости. Мы поможем сделать правильный выбор и проведём сделку под ключ.',
      stats: ['Объектов в базе', 'Лет опыта', 'Клиентов'],
      search: {
        all: 'Все объекты', placeholder: 'Город, район, улица или ключевое слово…', budget: 'Бюджет: любой',
        budgets: ['до 10 млн ₽', 'до 20 млн ₽', 'до 50 млн ₽', 'до 100 млн ₽'], submit: 'Найти',
      },
      featuredTitle: 'Рекомендуемые объекты',
      featuredDescription: 'Лучшие предложения, отобранные экспертами Rahat Home.',
      viewAll: 'Смотреть все',
      servicesTitle: 'Наши услуги',
      servicesDescription: 'Полный спектр услуг на рынке недвижимости с профессиональным сопровождением.',
      services: [
        { title: 'Покупка недвижимости', description: 'Полное сопровождение от подбора вариантов до получения ключей.' },
        { title: 'Продажа объектов', description: 'Эффективный маркетинг и поиск покупателей на вашу недвижимость.' },
        { title: 'Инвестиции', description: 'Подбор ликвидных объектов для инвестирования и сдачи в аренду.' },
        { title: 'Юридическое сопровождение', description: 'Проверка объектов и безопасное проведение сделки.' },
      ],
      testimonialsTitle: 'Отзывы клиентов',
      testimonialsDescription: 'Что говорят о нас люди, которые уже воспользовались нашими услугами.',
      testimonials: [
        { name: 'Елена Смирнова', role: 'Покупатель квартиры', content: 'Команда Rahat Home помогла нам спокойно пройти весь путь покупки первой квартиры и тщательно проверила документы.', initial: 'Е' },
        { name: 'Михаил Иванов', role: 'Инвестор', content: 'Команда отлично знает рынок и предлагает действительно ликвидные варианты с понятной экономикой.', initial: 'М' },
        { name: 'Анна Новикова', role: 'Продавец дома', content: 'Покупателя нашли быстро, а оформление сделки прошло организованно и без лишнего стресса.', initial: 'А' },
      ],
      ctaTitle: 'Готовы найти дом своей мечты?',
      ctaDescription: 'Расскажите о задаче, и наши специалисты предложат подходящие варианты.',
      consultation: 'Получить консультацию', catalog: 'Смотреть каталог',
      converter: {
        eyebrow: 'Валютный сервис Rahat Home',
        title: 'Сравните стоимость в удобной валюте',
        description: 'Пересчитайте бюджет объекта между рублями, долларами, евро и лирами по официальному курсу.',
        amount: 'Сумма', result: 'Получается', swap: 'Поменять валюты местами',
        live: 'Актуальный курс', cached: 'Последний сохранённый курс', loading: 'Загружаем курс…', unavailable: 'Курс временно недоступен',
        rate: 'Курс Банка России', updated: 'Дата курса', disclaimer: 'Расчёт носит справочный характер. Курс банка при сделке может отличаться.',
        official: 'Официальные данные ЦБ', automatic: 'Автообновление',
      },
    },
    catalog: {
      title: 'Каталог недвижимости', description: 'Подберите идеальный вариант с помощью удобных фильтров.', found: 'Найдено предложений', empty: 'Объекты не найдены',
      filters: 'Фильтры', reset: 'Сбросить', keyword: 'Поиск по названию и описанию', keywordPlaceholder: 'Ключевое слово…', category: 'Тип объекта', allCategories: 'Все категории',
      location: 'Город или район', locationPlaceholder: 'Москва, Подмосковье…', price: 'Стоимость (₽)', from: 'От', to: 'До', rooms: 'Комнаты', area: 'Площадь (м²)', apply: 'Показать результаты',
    },
    property: {
      back: 'Вернуться в каталог', fallbackNotice: 'Перевод этого объекта пока недоступен, поэтому показана доступная версия.', interested: 'Заинтересовал объект?', interestedDescription: 'Оставьте контакты, и наш агент свяжется с вами.', recommended: 'Рекомендуем', actual: 'Актуально', archived: 'В архиве',
      area: 'Площадь', rooms: 'Комнаты', floor: 'Этаж', year: 'Год постройки', parameters: 'Основные параметры', description: 'Описание объекта', noDescription: 'Описание пока не добавлено', freePlan: 'Своб. план.', unspecified: 'Не указан',
      noPhoto: 'Нет фото', photosSoon: 'Фотографии скоро появятся', photo: 'Фото', mainPhoto: 'Главное', enlarge: 'Увеличить фото', previousPhoto: 'Предыдущее фото', nextPhoto: 'Следующее фото', close: 'Закрыть',
      quickContact: 'Или свяжитесь сразу', whatsapp: 'WhatsApp', telegram: 'Telegram', call: 'Позвонить',
    },
    form: {
      name: 'Ваше имя', namePlaceholder: 'Иван Иванов', phone: 'Телефон', email: 'Email (необязательно)', message: 'Сообщение', messagePlaceholder: 'Ваш вопрос или комментарий…',
      propertyMessage: 'Здравствуйте! Меня интересует этот объект недвижимости.', submit: 'Оставить заявку', submitting: 'Отправка…', successTitle: 'Заявка отправлена!', successDescription: 'Наш специалист свяжется с вами в ближайшее время.', error: 'Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.',
    },
    contact: {
      title: 'Свяжитесь с нами', description: 'Мы готовы ответить на вопросы и помочь с выбором недвижимости.', info: 'Контактная информация', office: 'Наш офис', phone: 'Телефон', email: 'Email', hours: 'Режим работы', social: 'Мессенджеры и соцсети', write: 'Напишите нам', responseTime: 'Оставьте контакты — мы ответим в рабочее время.',
    },
    about: {
      title: 'О компании Rahat Home', intro: 'Мы — команда профессионалов, которая помогает находить подходящую недвижимость и принимать взвешенные инвестиционные решения.',
      stats: ['Лет опыта', 'Объектов в базе', 'Довольных клиентов', 'Экспертов в штате'], approachTitle: 'Наш подход к работе',
      paragraphs: ['Покупка или продажа недвижимости — важный этап. Поэтому мы строим работу на прозрачности, честности и профессионализме.', 'Юристы проверяют каждый объект, а агенты сопровождают клиента от первого разговора до передачи ключей.'],
      teamTitle: 'Наша команда руководителей', roles: ['Генеральный директор', 'Руководитель отдела продаж', 'Главный юрист'],
    },
    services: {
      eyebrow: 'Услуги агентства', title: 'Комплексные решения в сфере недвижимости', description: 'Решаем задачи с жилой и коммерческой недвижимостью: от консультации до регистрации прав.', consultation: 'Получить консультацию', properties: 'Смотреть объекты',
      trust: ['Опытная команда', 'Юридическая безопасность', 'Персональная стратегия'], sectionTitle: 'Чем мы можем помочь', sectionDescription: 'Выберите направление — мы соберём решение под вашу задачу.',
      items: [
        { title: 'Покупка недвижимости', description: 'Подберём варианты, организуем просмотры и согласуем условия.', features: ['Подбор по критериям', 'Переговоры о цене', 'Сопровождение сделки'] },
        { title: 'Продажа объекта', description: 'Подготовим позиционирование и выведем объект на рынок.', features: ['Оценка и стратегия', 'Фото и продвижение', 'Отбор покупателей'] },
        { title: 'Инвестиции', description: 'Сравним сценарии доходности и рисков.', features: ['Анализ рынка', 'Финансовая модель', 'Стратегия выхода'] },
        { title: 'Юридическое сопровождение', description: 'Проверим документы и безопасно организуем расчёты.', features: ['Проверка объекта', 'Договоры', 'Регистрация прав'] },
      ],
      processTitle: 'Как проходит работа', process: [
        { title: 'Знакомство', description: 'Фиксируем цель, сроки и критерии.' }, { title: 'Стратегия', description: 'Формируем план и подборку решений.' },
        { title: 'Проверка', description: 'Проверяем объект, документы и условия.' }, { title: 'Сделка', description: 'Сопровождаем расчёты, регистрацию и передачу ключей.' },
      ],
      ctaTitle: 'Нужна индивидуальная консультация?', ctaDescription: 'Расскажите о задаче, и эксперт предложит следующие шаги.', ctaButton: 'Связаться со специалистом',
    },
    news: { eyebrow: 'Новости и аналитика', title: 'Полезное о недвижимости', description: 'Разбираем рынок, документы, инвестиции и практические вопросы покупки и продажи.', metaTitle: 'Новости и статьи о недвижимости — Rahat Home', metaDescription: 'Аналитика рынка, советы по покупке и продаже, юридические разборы и новости Rahat Home.', readMore: 'Читать статью', allArticles: 'Все новости', empty: 'Публикаций пока нет', back: 'Все публикации', by: 'Автор', previous: 'Назад', next: 'Далее', page: 'Страница', fallbackNotice: 'Эта статья пока доступна на русском языке.', imageAlt: 'Обложка статьи', mediaTitle: 'Фото и видео', photo: 'Фото', video: 'Видео', openImage: 'Открыть изображение', previousImage: 'Предыдущее изображение', nextImage: 'Следующее изображение', closeMedia: 'Закрыть' },
    reviews: { title: 'Отзывы клиентов', description: 'Реальный опыт покупателей, продавцов, арендаторов и инвесторов Rahat Home.', metaTitle: 'Отзывы клиентов об Rahat Home', metaDescription: 'Подтверждённые отзывы клиентов о покупке, продаже и аренде недвижимости с Rahat Home.', leaveTitle: 'Оставить отзыв', leaveDescription: 'Расскажите о своём опыте. Отзыв появится на сайте после проверки.', name: 'Ваше имя', role: 'Тип услуги или роль', email: 'Email для проверки', phone: 'Телефон для проверки', rating: 'Оценка', content: 'Текст отзыва', consent: 'Я согласен на публикацию отзыва и обработку указанных данных.', submit: 'Отправить отзыв', submitting: 'Отправка…', successTitle: 'Спасибо за отзыв!', successDescription: 'Мы получили его и опубликуем после модерации.', error: 'Не удалось отправить отзыв. Проверьте поля и попробуйте снова.', verified: 'Подтверждённая сделка', companyResponse: 'Ответ Rahat Home', empty: 'Опубликованных отзывов пока нет.', invitationInvalid: 'Персональная ссылка недействительна или её срок истёк.', viewAll: 'Все отзывы', leaveReview: 'Оставить отзыв' },
    footer: { description: 'Надёжный партнёр в покупке, продаже и инвестициях в недвижимость.', navigation: 'Навигация', catalog: 'Каталог недвижимости', company: 'О компании', services: 'Наши услуги', contact: 'Контакты', news: 'Новости', reviews: 'Отзывы', admin: 'Панель администратора', copyright: 'Все права защищены.', privacy: 'Политика конфиденциальности', terms: 'Пользовательское соглашение' },
  },
  en: {
    home: {
      eyebrow: 'Premium real estate agency', title: 'Find the right property with Rahat Home', description: 'Selected apartments, houses and commercial properties with expert support from the first search to completion.', stats: ['Properties listed', 'Years of experience', 'Clients'],
      search: { all: 'All properties', placeholder: 'City, district, street or keyword…', budget: 'Any budget', budgets: ['up to ₽10M', 'up to ₽20M', 'up to ₽50M', 'up to ₽100M'], submit: 'Search' },
      featuredTitle: 'Featured properties', featuredDescription: 'Selected opportunities curated by Rahat Home experts.', viewAll: 'View all', servicesTitle: 'Our services', servicesDescription: 'End-to-end real estate support built around your goals.',
      services: [
        { title: 'Buying property', description: 'Support from shortlisting to receiving the keys.' }, { title: 'Selling property', description: 'Positioning, marketing and qualified buyer search.' },
        { title: 'Investments', description: 'Selection of liquid assets for income and growth.' }, { title: 'Legal support', description: 'Due diligence and secure transaction management.' },
      ],
      testimonialsTitle: 'Client stories', testimonialsDescription: 'What clients say after working with our team.', testimonials: [
        { name: 'Elena Smirnova', role: 'Apartment buyer', content: 'Rahat Home guided us through our first purchase calmly and checked every document in detail.', initial: 'E' },
        { name: 'Mikhail Ivanov', role: 'Investor', content: 'The team understands the market and presents liquid opportunities with clear numbers.', initial: 'M' },
        { name: 'Anna Novikova', role: 'Home seller', content: 'They found a buyer quickly and kept the transaction organised from start to finish.', initial: 'A' },
      ],
      ctaTitle: 'Ready to find your next home?', ctaDescription: 'Tell us what you need and our experts will prepare a focused shortlist.', consultation: 'Book a consultation', catalog: 'Browse properties',
      converter: {
        eyebrow: 'Rahat Home currency service', title: 'Compare property values in your preferred currency', description: 'Convert your property budget between roubles, US dollars, euros and Turkish lira using the official reference rate.',
        amount: 'Amount', result: 'Converted amount', swap: 'Swap currencies', live: 'Current rate', cached: 'Latest saved rate', loading: 'Loading the rate…', unavailable: 'The rate is temporarily unavailable',
        rate: 'Bank of Russia rate', updated: 'Rate date', disclaimer: 'This calculation is for reference only. Your bank’s transaction rate may differ.', official: 'Official central bank data', automatic: 'Automatic updates',
      },
    },
    catalog: { title: 'Property catalogue', description: 'Use focused filters to find the right option.', found: 'Properties found', empty: 'No properties found', filters: 'Filters', reset: 'Reset', keyword: 'Title and description', keywordPlaceholder: 'Keyword…', category: 'Property type', allCategories: 'All categories', location: 'City or district', locationPlaceholder: 'City or district…', price: 'Price (₽)', from: 'From', to: 'To', rooms: 'Rooms', area: 'Area (m²)', apply: 'Show results' },
    property: { back: 'Back to properties', fallbackNotice: 'This listing is not available in English yet, so another available version is shown.', interested: 'Interested in this property?', interestedDescription: 'Leave your details and our agent will contact you.', recommended: 'Featured', actual: 'Available', archived: 'Archived', area: 'Area', rooms: 'Rooms', floor: 'Floor', year: 'Year built', parameters: 'Key details', description: 'Property description', noDescription: 'Description is not available yet', freePlan: 'Open plan', unspecified: 'Not specified', noPhoto: 'No photo', photosSoon: 'Photos will be added soon', photo: 'Photo', mainPhoto: 'Main', enlarge: 'Enlarge photo', previousPhoto: 'Previous photo', nextPhoto: 'Next photo', close: 'Close', quickContact: 'Or contact us now', whatsapp: 'WhatsApp', telegram: 'Telegram', call: 'Call' },
    form: { name: 'Your name', namePlaceholder: 'John Smith', phone: 'Phone', email: 'Email (optional)', message: 'Message', messagePlaceholder: 'How can we help?', propertyMessage: 'Hello! I am interested in this property.', submit: 'Send enquiry', submitting: 'Sending…', successTitle: 'Enquiry sent', successDescription: 'Our specialist will contact you shortly.', error: 'We could not send your enquiry. Check the details and try again.' },
    contact: { title: 'Contact us', description: 'Ask a question or tell us what kind of property you are looking for.', info: 'Contact information', office: 'Our office', phone: 'Phone', email: 'Email', hours: 'Working hours', social: 'Messengers and social media', write: 'Send us a message', responseTime: 'Leave your details and we will reply during working hours.' },
    about: { title: 'About Rahat Home', intro: 'We help clients find the right property and make informed investment decisions.', stats: ['Years of experience', 'Properties listed', 'Happy clients', 'In-house experts'], approachTitle: 'How we work', paragraphs: ['Buying or selling property is an important step. We build every engagement around transparency, integrity and professional advice.', 'Our lawyers review each property while our agents stay with you from the first conversation to key handover.'], teamTitle: 'Leadership team', roles: ['Chief Executive Officer', 'Head of Sales', 'Head of Legal'] },
    services: { eyebrow: 'Agency services', title: 'Complete real estate solutions', description: 'Residential and commercial support from the first consultation to registration.', consultation: 'Book a consultation', properties: 'Browse properties', trust: ['Experienced team', 'Legal confidence', 'Personal strategy'], sectionTitle: 'How we can help', sectionDescription: 'Choose a direction and we will tailor the process to your goal.', items: [
      { title: 'Buying property', description: 'Shortlisting, viewings and negotiations.', features: ['Focused search', 'Price negotiation', 'Transaction support'] }, { title: 'Selling property', description: 'Positioning and a structured route to market.', features: ['Valuation', 'Marketing', 'Buyer qualification'] },
      { title: 'Investments', description: 'Compare returns, risks and exit scenarios.', features: ['Market analysis', 'Financial model', 'Exit strategy'] }, { title: 'Legal support', description: 'Documents, contracts and secure settlement.', features: ['Due diligence', 'Contracts', 'Registration'] },
    ], processTitle: 'Our process', process: [{ title: 'Discovery', description: 'We define goals, timing and criteria.' }, { title: 'Strategy', description: 'We prepare the plan and shortlist.' }, { title: 'Verification', description: 'We review the property and documents.' }, { title: 'Completion', description: 'We manage settlement, registration and handover.' }], ctaTitle: 'Need a personal consultation?', ctaDescription: 'Tell us about your goal and an expert will outline the next steps.', ctaButton: 'Talk to an expert' },
    news: { eyebrow: 'News and insight', title: 'Real estate, explained', description: 'Market insight, legal guidance and practical advice for buyers, sellers and investors.', metaTitle: 'Real estate news and insight — Rahat Home', metaDescription: 'Market analysis, buying and selling advice, legal explainers and Rahat Home news.', readMore: 'Read article', allArticles: 'All news', empty: 'No publications yet', back: 'All publications', by: 'By', previous: 'Previous', next: 'Next', page: 'Page', fallbackNotice: 'This article is currently available in Russian.', imageAlt: 'Article cover', mediaTitle: 'Photos and video', photo: 'Photo', video: 'Video', openImage: 'Open image', previousImage: 'Previous image', nextImage: 'Next image', closeMedia: 'Close' },
    reviews: { title: 'Client reviews', description: 'Real experiences from Rahat Home buyers, sellers, tenants and investors.', metaTitle: 'Rahat Home client reviews', metaDescription: 'Verified client reviews about buying, selling and renting property with Rahat Home.', leaveTitle: 'Leave a review', leaveDescription: 'Tell us about your experience. Reviews are published after moderation.', name: 'Your name', role: 'Service or role', email: 'Email for verification', phone: 'Phone for verification', rating: 'Rating', content: 'Your review', consent: 'I agree to publication of my review and processing of the submitted data.', submit: 'Send review', submitting: 'Sending…', successTitle: 'Thank you!', successDescription: 'We received your review and will publish it after moderation.', error: 'We could not send your review. Check the fields and try again.', verified: 'Verified transaction', companyResponse: 'Rahat Home response', empty: 'No published reviews yet.', invitationInvalid: 'This personal link is invalid or has expired.', viewAll: 'All reviews', leaveReview: 'Leave a review' },
    footer: { description: 'A trusted partner for property buying, selling and investment.', navigation: 'Navigation', catalog: 'Property catalogue', company: 'About us', services: 'Our services', contact: 'Contact', news: 'News', reviews: 'Reviews', admin: 'Administration', copyright: 'All rights reserved.', privacy: 'Privacy policy', terms: 'Terms of use' },
  },
  tr: {
    home: {
      eyebrow: 'Premium gayrimenkul danışmanlığı', title: 'Doğru gayrimenkulü Rahat Home ile bulun', description: 'Daire, villa ve ticari gayrimenkul seçeneklerinde aramadan tapu sürecine kadar uzman desteği.', stats: ['Portföydeki ilan', 'Yıllık deneyim', 'Müşteri'],
      search: { all: 'Tüm ilanlar', placeholder: 'Şehir, bölge, sokak veya anahtar kelime…', budget: 'Bütçe: tümü', budgets: ['₽10 Mn’a kadar', '₽20 Mn’a kadar', '₽50 Mn’a kadar', '₽100 Mn’a kadar'], submit: 'Ara' },
      featuredTitle: 'Öne çıkan ilanlar', featuredDescription: 'Rahat Home uzmanları tarafından seçilen fırsatlar.', viewAll: 'Tümünü gör', servicesTitle: 'Hizmetlerimiz', servicesDescription: 'Hedefinize göre uçtan uca gayrimenkul desteği.', services: [
        { title: 'Gayrimenkul alımı', description: 'Portföy seçiminden anahtar teslimine kadar destek.' }, { title: 'Gayrimenkul satışı', description: 'Konumlandırma, pazarlama ve nitelikli alıcı arama.' },
        { title: 'Yatırım', description: 'Gelir ve değer artışı için likit varlık seçimi.' }, { title: 'Hukuki destek', description: 'Belge kontrolü ve güvenli işlem yönetimi.' },
      ], testimonialsTitle: 'Müşteri deneyimleri', testimonialsDescription: 'Bizimle çalışan müşterilerin görüşleri.', testimonials: [
        { name: 'Elena Smirnova', role: 'Daire alıcısı', content: 'Rahat Home ilk satın alma sürecimizi sakin ve düzenli yönetti, tüm belgeleri ayrıntılı kontrol etti.', initial: 'E' },
        { name: 'Mikhail Ivanov', role: 'Yatırımcı', content: 'Ekip piyasayı iyi tanıyor ve rakamları net, likit seçenekler sunuyor.', initial: 'M' },
        { name: 'Anna Novikova', role: 'Ev satıcısı', content: 'Alıcıyı hızlı buldular ve süreci baştan sona düzenli yönettiler.', initial: 'A' },
      ], ctaTitle: 'Yeni evinizi bulmaya hazır mısınız?', ctaDescription: 'İhtiyacınızı anlatın, uzmanlarımız size özel bir liste hazırlasın.', consultation: 'Danışmanlık alın', catalog: 'İlanları incele',
      converter: {
        eyebrow: 'Rahat Home döviz servisi', title: 'Gayrimenkul değerini tercih ettiğiniz para biriminde karşılaştırın', description: 'Gayrimenkul bütçenizi resmî referans kuruyla ruble, ABD doları, euro ve Türk lirası arasında hesaplayın.',
        amount: 'Tutar', result: 'Dönüştürülen tutar', swap: 'Para birimlerini değiştir', live: 'Güncel kur', cached: 'Son kaydedilen kur', loading: 'Kur yükleniyor…', unavailable: 'Kura geçici olarak ulaşılamıyor',
        rate: 'Rusya Merkez Bankası kuru', updated: 'Kur tarihi', disclaimer: 'Bu hesaplama yalnızca bilgi amaçlıdır. Bankanızın işlem kuru farklı olabilir.', official: 'Resmî merkez bankası verisi', automatic: 'Otomatik güncelleme',
      },
    },
    catalog: { title: 'Gayrimenkul ilanları', description: 'Uygun seçeneği filtrelerle kolayca bulun.', found: 'Bulunan ilan', empty: 'İlan bulunamadı', filters: 'Filtreler', reset: 'Temizle', keyword: 'Başlık ve açıklama', keywordPlaceholder: 'Anahtar kelime…', category: 'Gayrimenkul türü', allCategories: 'Tüm kategoriler', location: 'Şehir veya bölge', locationPlaceholder: 'Şehir veya bölge…', price: 'Fiyat (₽)', from: 'En az', to: 'En fazla', rooms: 'Oda', area: 'Alan (m²)', apply: 'Sonuçları göster' },
    property: { back: 'İlanlara dön', fallbackNotice: 'Bu ilanın Türkçe çevirisi henüz yok; mevcut başka bir sürüm gösteriliyor.', interested: 'Bu ilanla ilgileniyor musunuz?', interestedDescription: 'Bilgilerinizi bırakın, danışmanımız sizi arasın.', recommended: 'Öne çıkan', actual: 'Satışta', archived: 'Arşivde', area: 'Alan', rooms: 'Oda', floor: 'Kat', year: 'Yapım yılı', parameters: 'Temel özellikler', description: 'İlan açıklaması', noDescription: 'Açıklama henüz eklenmedi', freePlan: 'Açık plan', unspecified: 'Belirtilmedi', noPhoto: 'Fotoğraf yok', photosSoon: 'Fotoğraflar yakında eklenecek', photo: 'Fotoğraf', mainPhoto: 'Ana', enlarge: 'Fotoğrafı büyüt', previousPhoto: 'Önceki fotoğraf', nextPhoto: 'Sonraki fotoğraf', close: 'Kapat', quickContact: 'Ya da hemen iletişime geçin', whatsapp: 'WhatsApp', telegram: 'Telegram', call: 'Ara' },
    form: { name: 'Adınız', namePlaceholder: 'Ad Soyad', phone: 'Telefon', email: 'E-posta (isteğe bağlı)', message: 'Mesaj', messagePlaceholder: 'Size nasıl yardımcı olabiliriz?', propertyMessage: 'Merhaba! Bu gayrimenkul ilanıyla ilgileniyorum.', submit: 'Talep gönder', submitting: 'Gönderiliyor…', successTitle: 'Talebiniz gönderildi', successDescription: 'Uzmanımız kısa süre içinde sizinle iletişime geçecek.', error: 'Talep gönderilemedi. Bilgileri kontrol edip tekrar deneyin.' },
    contact: { title: 'Bize ulaşın', description: 'Sorunuzu veya aradığınız gayrimenkulü bize anlatın.', info: 'İletişim bilgileri', office: 'Ofisimiz', phone: 'Telefon', email: 'E-posta', hours: 'Çalışma saatleri', social: 'Mesajlaşma ve sosyal medya', write: 'Bize yazın', responseTime: 'Bilgilerinizi bırakın, çalışma saatlerinde size dönüş yapalım.' },
    about: { title: 'Rahat Home hakkında', intro: 'Doğru gayrimenkulü bulmanıza ve bilinçli yatırım kararları vermenize yardımcı oluyoruz.', stats: ['Yıllık deneyim', 'Portföydeki ilan', 'Mutlu müşteri', 'Uzman'], approachTitle: 'Çalışma şeklimiz', paragraphs: ['Gayrimenkul almak veya satmak önemli bir adımdır. Sürecimizi şeffaflık, dürüstlük ve profesyonel danışmanlık üzerine kuruyoruz.', 'Hukuk ekibimiz her ilanı inceler, danışmanlarımız ilk görüşmeden anahtar teslimine kadar yanınızda olur.'], teamTitle: 'Yönetim ekibi', roles: ['Genel Müdür', 'Satış Direktörü', 'Hukuk Direktörü'] },
    services: { eyebrow: 'Danışmanlık hizmetleri', title: 'Kapsamlı gayrimenkul çözümleri', description: 'İlk görüşmeden tapu işlemlerine kadar konut ve ticari gayrimenkul desteği.', consultation: 'Danışmanlık alın', properties: 'İlanları incele', trust: ['Deneyimli ekip', 'Hukuki güven', 'Kişisel strateji'], sectionTitle: 'Nasıl yardımcı olabiliriz?', sectionDescription: 'Hedefinizi seçin, süreci size göre planlayalım.', items: [
      { title: 'Gayrimenkul alımı', description: 'Seçim, gösterim ve pazarlık desteği.', features: ['Hedefli arama', 'Fiyat pazarlığı', 'İşlem desteği'] }, { title: 'Gayrimenkul satışı', description: 'Doğru konumlandırma ve pazara çıkış planı.', features: ['Değerleme', 'Pazarlama', 'Alıcı seçimi'] },
      { title: 'Yatırım', description: 'Getiri, risk ve çıkış seçeneklerini karşılaştırın.', features: ['Piyasa analizi', 'Finansal model', 'Çıkış stratejisi'] }, { title: 'Hukuki destek', description: 'Belge, sözleşme ve güvenli ödeme yönetimi.', features: ['Hukuki inceleme', 'Sözleşmeler', 'Tapu işlemleri'] },
    ], processTitle: 'Çalışma süreci', process: [{ title: 'Tanışma', description: 'Hedef, süre ve kriterleri belirleriz.' }, { title: 'Strateji', description: 'Planı ve seçenekleri hazırlarız.' }, { title: 'Kontrol', description: 'Gayrimenkulü ve belgeleri inceleriz.' }, { title: 'Tamamlama', description: 'Ödeme, tapu ve teslim sürecini yönetiriz.' }], ctaTitle: 'Kişisel danışmanlık ister misiniz?', ctaDescription: 'Hedefinizi anlatın, uzmanımız sonraki adımları paylaşsın.', ctaButton: 'Uzmanla görüşün' },
    news: { eyebrow: 'Haberler ve analizler', title: 'Gayrimenkulü yakından tanıyın', description: 'Piyasa analizleri, hukuki bilgiler ve alıcı, satıcı ve yatırımcılar için pratik öneriler.', metaTitle: 'Gayrimenkul haberleri ve analizleri — Rahat Home', metaDescription: 'Piyasa analizleri, alım satım önerileri, hukuki rehberler ve Rahat Home haberleri.', readMore: 'Makaleyi oku', allArticles: 'Tüm haberler', empty: 'Henüz yayın yok', back: 'Tüm yayınlar', by: 'Yazar', previous: 'Önceki', next: 'Sonraki', page: 'Sayfa', fallbackNotice: 'Bu makale şu anda Rusça olarak sunuluyor.', imageAlt: 'Makale kapak görseli', mediaTitle: 'Fotoğraf ve video', photo: 'Fotoğraf', video: 'Video', openImage: 'Görseli aç', previousImage: 'Önceki görsel', nextImage: 'Sonraki görsel', closeMedia: 'Kapat' },
    reviews: { title: 'Müşteri yorumları', description: 'Rahat Home alıcılarının, satıcılarının, kiracıların ve yatırımcıların gerçek deneyimleri.', metaTitle: 'Rahat Home müşteri yorumları', metaDescription: 'Rahat Home ile gayrimenkul alım, satım ve kiralama süreçlerine ait doğrulanmış müşteri yorumları.', leaveTitle: 'Yorum bırakın', leaveDescription: 'Deneyiminizi paylaşın. Yorumunuz kontrolden sonra yayınlanacaktır.', name: 'Adınız', role: 'Hizmet veya rol', email: 'Doğrulama için e-posta', phone: 'Doğrulama için telefon', rating: 'Puan', content: 'Yorumunuz', consent: 'Yorumumun yayınlanmasını ve ilettiğim verilerin işlenmesini kabul ediyorum.', submit: 'Yorumu gönder', submitting: 'Gönderiliyor…', successTitle: 'Teşekkür ederiz!', successDescription: 'Yorumunuzu aldık ve moderasyondan sonra yayınlayacağız.', error: 'Yorum gönderilemedi. Alanları kontrol edip tekrar deneyin.', verified: 'Doğrulanmış işlem', companyResponse: 'Rahat Home yanıtı', empty: 'Henüz yayınlanmış yorum yok.', invitationInvalid: 'Bu kişisel bağlantı geçersiz veya süresi dolmuş.', viewAll: 'Tüm yorumlar', leaveReview: 'Yorum bırakın' },
    footer: { description: 'Gayrimenkul alımı, satışı ve yatırımı için güvenilir çözüm ortağınız.', navigation: 'Menü', catalog: 'Gayrimenkul ilanları', company: 'Hakkımızda', services: 'Hizmetlerimiz', contact: 'İletişim', news: 'Haberler', reviews: 'Yorumlar', admin: 'Yönetim', copyright: 'Tüm hakları saklıdır.', privacy: 'Gizlilik politikası', terms: 'Kullanım koşulları' },
  },
  ar: arabicSiteCopy,
};
