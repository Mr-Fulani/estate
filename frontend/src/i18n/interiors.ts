import type { Locale } from './config';

export const interiorCopy: Record<Locale, { skip: string; scroll: string; manual: string; detail: string; rooms: Record<string, string> }> = {
  ru: { skip: 'К планировкам', scroll: 'Листайте, чтобы исследовать', manual: 'Выберите пространство', detail: 'Характер в каждой детали', rooms: { living: 'Гостиная', bedroom: 'Спальня', study: 'Кабинет', lobby: 'Лобби' } },
  en: { skip: 'View floor plans', scroll: 'Scroll to explore', manual: 'Choose a space', detail: 'Character in every detail', rooms: { living: 'Living room', bedroom: 'Bedroom', study: 'Study', lobby: 'Lobby' } },
  tr: { skip: 'Kat planlarına geç', scroll: 'Keşfetmek için kaydırın', manual: 'Bir mekân seçin', detail: 'Her detayda karakter', rooms: { living: 'Salon', bedroom: 'Yatak odası', study: 'Çalışma odası', lobby: 'Lobi' } },
  ar: { skip: 'عرض المخططات', scroll: 'مرّر للاستكشاف', manual: 'اختر المساحة', detail: 'شخصية في كل تفصيل', rooms: { living: 'غرفة المعيشة', bedroom: 'غرفة النوم', study: 'المكتب', lobby: 'الردهة' } },
};
