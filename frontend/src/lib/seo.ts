import type { Metadata } from 'next';

import type { Locale } from '@/i18n/config';


type StaticSeoPage = 'properties' | 'services' | 'about' | 'contact' | 'privacy' | 'terms';

const staticSeoCopy: Record<StaticSeoPage, Record<Locale, { title: string; description: string }>> = {
  properties: {
    ru: { title: 'Недвижимость в Стамбуле — каталог Estate', description: 'Квартиры, виллы и коммерческая недвижимость в Стамбуле. Подбор, проверка и сопровождение сделки.' },
    en: { title: 'Istanbul property listings — Estate', description: 'Apartments, villas and commercial property in Istanbul with due diligence and end-to-end transaction support.' },
    tr: { title: 'İstanbul gayrimenkul ilanları — Estate', description: 'İstanbul’da daire, villa ve ticari gayrimenkuller. Seçim, inceleme ve işlem sürecinde uçtan uca destek.' },
  },
  services: {
    ru: { title: 'Услуги по недвижимости в Турции — Estate', description: 'Подбор, покупка, продажа и аренда недвижимости в Турции, юридическая проверка и сопровождение.' },
    en: { title: 'Real estate services in Türkiye — Estate', description: 'Property search, purchase, sale and rental in Türkiye with legal due diligence and transaction support.' },
    tr: { title: 'Türkiye gayrimenkul hizmetleri — Estate', description: 'Gayrimenkul arama, alım, satım ve kiralama; hukuki inceleme ve işlem danışmanlığı.' },
  },
  about: {
    ru: { title: 'О компании Estate', description: 'Estate помогает покупать, продавать и арендовать недвижимость в Стамбуле с прозрачным сопровождением.' },
    en: { title: 'About Estate', description: 'Estate helps clients buy, sell and rent property in Istanbul with clear, end-to-end support.' },
    tr: { title: 'Estate hakkında', description: 'Estate, İstanbul’da gayrimenkul alım, satım ve kiralama süreçlerinde şeffaf ve kapsamlı destek sunar.' },
  },
  contact: {
    ru: { title: 'Контакты Estate — Стамбул, Бейликдюзю', description: 'Свяжитесь с Estate по вопросам покупки, продажи и аренды недвижимости в Стамбуле.' },
    en: { title: 'Contact Estate — Beylikdüzü, Istanbul', description: 'Contact Estate about buying, selling or renting property in Istanbul.' },
    tr: { title: 'Estate iletişim — Beylikdüzü, İstanbul', description: 'İstanbul’da gayrimenkul alım, satım veya kiralama hakkında Estate ile iletişime geçin.' },
  },
  privacy: {
    ru: { title: 'Политика конфиденциальности — Estate', description: 'Как Estate собирает, использует и защищает персональные данные посетителей сайта и клиентов.' },
    en: { title: 'Privacy policy — Estate', description: 'How Estate collects, uses and protects website visitor and client personal data.' },
    tr: { title: 'Gizlilik politikası — Estate', description: 'Estate’in site ziyaretçisi ve müşteri kişisel verilerini nasıl topladığı, kullandığı ve koruduğu.' },
  },
  terms: {
    ru: { title: 'Условия использования — Estate', description: 'Условия использования сайта Estate и опубликованной информации о недвижимости.' },
    en: { title: 'Terms of use — Estate', description: 'Terms for using the Estate website and its published property information.' },
    tr: { title: 'Kullanım koşulları — Estate', description: 'Estate web sitesinin ve yayınlanan gayrimenkul bilgilerinin kullanım koşulları.' },
  },
};


export function localizedAlternates(path: string) {
  return {
    ru: `/ru${path}`,
    en: `/en${path}`,
    tr: `/tr${path}`,
    'x-default': `/ru${path}`,
  };
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
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Estate',
      locale: locale === 'ru' ? 'ru_RU' : locale === 'tr' ? 'tr_TR' : 'en_US',
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
