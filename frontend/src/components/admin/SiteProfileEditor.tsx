'use client';
import { useLocale } from '@/context/LocaleContext';
import { useState } from 'react';
import { localeLabels, type Locale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { legalCopy } from '@/i18n/legalCopy';
import { copyFields, type SiteProfile, type SeoPage } from '@/lib/site-profile';

const identityFields = {
  brand_name: 'Название компании', legal_name: 'Юридическое название', logo_url: 'Логотип',
  icon_url: 'Иконка сайта', og_image_url: 'Изображение для социальных сетей', hero_image_url: 'Фото на главной', about_image_url: 'Фото компании',
  address_locality: 'Город', address_region: 'Регион', address_country: 'Код страны (например, TR)', postal_code: 'Почтовый индекс',
} as const;
const pages: Record<SeoPage, string> = {home:'Главная',collections:'Подборки',properties:'Каталог',services:'Услуги',about:'О компании',contact:'Контакты',news:'Новости',reviews:'Отзывы',privacy:'Конфиденциальность',terms:'Условия использования'};
const groups = {home:'Главная',catalog:'Каталог',property:'Карточка объекта',form:'Формы',contact:'Контакты',about:'О компании',services:'Услуги',news:'Новости',reviews:'Отзывы',footer:'Подвал',legal:'Юридические страницы'};
const inputClass = 'mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal';

export function SiteProfileEditor({ profile, onChange }: {profile: SiteProfile; onChange: (profile: SiteProfile) => void}) {
  const { activeLocales: locales, defaultLocale } = useLocale();
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [section, setSection] = useState('home');
  const [search, setSearch] = useState('');
  const fields = copyFields({...siteCopy[locale], legal: legalCopy[locale]}).filter(([key, text]) => key.startsWith(`${section}.`) && (!search || text.toLowerCase().includes(search.toLowerCase())));
  return <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
    <fieldset className="space-y-3 rounded-xl border p-4"><legend>Источники обращений</legend>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={profile.attribution_enabled !== false} onChange={event => onChange({...profile, attribution_enabled: event.target.checked})} />Сохранять первый и последний источник визита</label>
      <label className="block text-sm">Срок хранения в браузере: 0 — вкладка, 1–90 — дни<input type="number" min={0} max={90} value={profile.attribution_retention_days || 0} onChange={event => onChange({...profile, attribution_retention_days: Number(event.target.value)})} className="ms-3 w-20 rounded border p-2" /></label>
      <p className="text-xs text-slate-500">Используйте срок, соответствующий политике компании. Передача в CRM происходит при обращении или клике в контакт.</p>
    </fieldset>
    <label className="flex items-start gap-3 text-sm font-semibold"><input type="checkbox" checked={profile.content_reviewed || false} onChange={event=>onChange({...profile,content_reviewed:event.target.checked})}/>Тексты, услуги и данные компании проверены для публикации</label>
    <h2 className="text-lg font-bold">Компания, изображения и SEO</h2>
    <p className="text-sm text-slate-500">Домен задаётся при развёртывании. Здесь хранится информация именно этой компании. Для изображений используйте адрес HTTPS или путь к загруженному файлу.</p>
    <div className="grid gap-4 sm:grid-cols-2">{Object.entries(identityFields).map(([key,label]) => <label key={key} className="text-sm font-semibold">{label}<input className={inputClass} value={profile[key as keyof typeof identityFields] || ''} onChange={event=>onChange({...profile,[key]:event.target.value})} /></label>)}</div>
    <label className="block text-sm font-semibold">Язык текстов<select className={inputClass} value={locale} onChange={event=>setLocale(event.target.value as Locale)}>{locales.map(value=><option key={value} value={value}>{localeLabels[value]}</option>)}</select></label>
    <label className="block text-sm font-semibold">Быстрые бюджеты поиска (в валюте фильтра, через запятую)<input className={inputClass} defaultValue={(profile.price_presets || []).join(', ')} onBlur={event=>onChange({...profile,price_presets:event.target.value.split(',').map(value=>Number(value.trim())).filter(value=>Number.isFinite(value) && value>0)})}/></label>
    <details><summary className="cursor-pointer font-bold">Заголовки и описания для поиска</summary><div className="mt-4 space-y-5">{Object.entries(pages).map(([key,label])=>{
      const page=key as SeoPage; const value=profile.seo?.[locale]?.[page] || {title:'',description:''};
      const change=(field: 'title'|'description', text:string)=>onChange({...profile,seo:{...profile.seo,[locale]:{...profile.seo?.[locale],[page]:{...value,[field]:text}}}});
      return <fieldset key={page} className="rounded-xl border p-4"><legend className="px-2 font-semibold">{label}</legend><label className="block text-sm">Заголовок<input maxLength={240} className={inputClass} value={value.title} onChange={event=>change('title',event.target.value)} /></label><label className="mt-3 block text-sm">Описание<textarea maxLength={500} rows={3} className={inputClass} value={value.description} onChange={event=>change('description',event.target.value)} /></label></fieldset>;
    })}</div></details>
    <details><summary className="cursor-pointer font-bold">Тексты страниц</summary>
      <p className="mt-3 text-sm text-slate-500">Название компании подставляется вместо {'{brand}'}. Пустое поле скрывает текст. Проверьте услуги, обещания и юридические тексты перед публикацией.</p>
      <select aria-label="Раздел" className={inputClass} value={section} onChange={event=>setSection(event.target.value)}>{Object.entries(groups).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
      <input aria-label="Поиск текста" placeholder="Найти текст в разделе" className={inputClass} value={search} onChange={event=>setSearch(event.target.value)} />
      <div className="mt-4 space-y-4">{fields.map(([key,text])=><label className="block text-sm font-medium" key={key}>{text.slice(0,100) || 'Дата обновления'}<textarea dir={locale === 'ar' ? 'rtl' : 'ltr'} rows={text.length>100 ? 3 : 2} className={inputClass} value={profile.copy?.[locale]?.[key] ?? text} onChange={event=>onChange({...profile,copy:{...profile.copy,[locale]:{...profile.copy?.[locale],[key]:event.target.value}}})}/></label>)}</div>
    </details>
  </div>;
}
