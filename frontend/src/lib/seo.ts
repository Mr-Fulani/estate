import type { Metadata } from 'next';

import { locales, openGraphLocales, type Locale } from '@/i18n/config';


type StaticSeoPage = 'properties' | 'services' | 'about' | 'contact' | 'privacy' | 'terms';

const staticSeoCopy: Record<StaticSeoPage, Record<Locale, { title: string; description: string }>> = {
  properties: {
    ru: { title: 'Недвижимость в Стамбуле — каталог Rahat Home', description: 'Квартиры, виллы и коммерческая недвижимость в Стамбуле. Подбор, проверка и сопровождение сделки.' },
    en: { title: 'Istanbul property listings — Rahat Home', description: 'Apartments, villas and commercial property in Istanbul with due diligence and end-to-end transaction support.' },
    tr: { title: 'İstanbul gayrimenkul ilanları — Rahat Home', description: 'İstanbul’da daire, villa ve ticari gayrimenkuller. Seçim, inceleme ve işlem sürecinde uçtan uca destek.' },
    ar: { title: 'عقارات إسطنبول — دليل Rahat Home', description: 'شقق وفلل وعقارات تجارية في إسطنبول مع الفحص القانوني والدعم الكامل لإتمام الصفقة.' },
  },
  services: {
    ru: { title: 'Услуги по недвижимости в Турции — Rahat Home', description: 'Подбор, покупка, продажа и аренда недвижимости в Турции, юридическая проверка и сопровождение.' },
    en: { title: 'Real estate services in Türkiye — Rahat Home', description: 'Property search, purchase, sale and rental in Türkiye with legal due diligence and transaction support.' },
    tr: { title: 'Türkiye gayrimenkul hizmetleri — Rahat Home', description: 'Gayrimenkul arama, alım, satım ve kiralama; hukuki inceleme ve işlem danışmanlığı.' },
    ar: { title: 'الخدمات العقارية في تركيا — Rahat Home', description: 'البحث عن العقارات وشراؤها وبيعها واستئجارها في تركيا مع الفحص القانوني ودعم الصفقة.' },
  },
  about: {
    ru: { title: 'О компании Rahat Home', description: 'Rahat Home помогает покупать, продавать и арендовать недвижимость в Стамбуле с прозрачным сопровождением.' },
    en: { title: 'About Rahat Home', description: 'Rahat Home helps clients buy, sell and rent property in Istanbul with clear, end-to-end support.' },
    tr: { title: 'Rahat Home hakkında', description: 'Rahat Home, İstanbul’da gayrimenkul alım, satım ve kiralama süreçlerinde şeffaf ve kapsamlı destek sunar.' },
    ar: { title: 'عن Rahat Home', description: 'تساعد Rahat Home العملاء على شراء العقارات وبيعها واستئجارها في إسطنبول بدعم واضح ومتكامل.' },
  },
  contact: {
    ru: { title: 'Контакты Rahat Home — Стамбул, Бейликдюзю', description: 'Свяжитесь с Rahat Home по вопросам покупки, продажи и аренды недвижимости в Стамбуле.' },
    en: { title: 'Contact Rahat Home — Beylikdüzü, Istanbul', description: 'Contact Rahat Home about buying, selling or renting property in Istanbul.' },
    tr: { title: 'Rahat Home iletişim — Beylikdüzü, İstanbul', description: 'İstanbul’da gayrimenkul alım, satım veya kiralama hakkında Rahat Home ile iletişime geçin.' },
    ar: { title: 'تواصل مع Rahat Home — بيليك دوزو، إسطنبول', description: 'تواصل مع Rahat Home بشأن شراء العقارات أو بيعها أو استئجارها في إسطنبول.' },
  },
  privacy: {
    ru: { title: 'Политика конфиденциальности — Rahat Home', description: 'Как Rahat Home собирает, использует и защищает персональные данные посетителей сайта и клиентов.' },
    en: { title: 'Privacy policy — Rahat Home', description: 'How Rahat Home collects, uses and protects website visitor and client personal data.' },
    tr: { title: 'Gizlilik politikası — Rahat Home', description: 'Rahat Home’in site ziyaretçisi ve müşteri kişisel verilerini nasıl topladığı, kullandığı ve koruduğu.' },
    ar: { title: 'سياسة الخصوصية — Rahat Home', description: 'كيفية جمع Rahat Home للبيانات الشخصية لزوار الموقع والعملاء واستخدامها وحمايتها.' },
  },
  terms: {
    ru: { title: 'Условия использования — Rahat Home', description: 'Условия использования сайта Rahat Home и опубликованной информации о недвижимости.' },
    en: { title: 'Terms of use — Rahat Home', description: 'Terms for using the Rahat Home website and its published property information.' },
    tr: { title: 'Kullanım koşulları — Rahat Home', description: 'Rahat Home web sitesinin ve yayınlanan gayrimenkul bilgilerinin kullanım koşulları.' },
    ar: { title: 'شروط الاستخدام — Rahat Home', description: 'شروط استخدام موقع Rahat Home ومعلومات العقارات المنشورة فيه.' },
  },
};


export function localizedAlternates(path: string) {
  return Object.fromEntries([
    ...locales.map((locale) => [locale, `/${locale}${path}`]),
    ['x-default', `/ru${path}`],
  ]);
}


export function localizedPageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  options: { canonicalSuffix?: string; index?: boolean; image?: string | null } = {},
): Metadata {
  const canonical = `/${locale}${path}${options.canonicalSuffix || ''}`;
  const image = options.image === undefined ? '/og.png' : options.image;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: localizedAlternates(`${path}${options.canonicalSuffix || ''}`),
    },
    robots: options.index === false ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Rahat Home',
      locale: openGraphLocales[locale],
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}


export function staticPageMetadata(locale: Locale, page: StaticSeoPage): Metadata {
  const copy = staticSeoCopy[page][locale];
  return localizedPageMetadata(locale, `/${page}`, copy.title, copy.description);
}
