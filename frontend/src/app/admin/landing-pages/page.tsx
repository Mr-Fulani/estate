'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { fetchLandingPages, saveLandingPage, fetchCategories } from '@/lib/api';
import type { LandingPage, LandingTranslation } from '@/lib/landing-pages';
import type { Category } from '@/types';
import { localeLabels } from '@/i18n/config';

const empty: LandingPage={slug:'',is_published:false,filters:{},translations:{}};
const blank: LandingTranslation={title:'',description:'',content:'',meta_title:''};
const field='mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm';
export default function LandingPageManager() {
  const {activeLocales,defaultLocale}=useLocale();
  const [locale,setLocale]=useState(defaultLocale);
  const [pages,setPages]=useState<LandingPage[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [page,setPage]=useState<LandingPage>(empty);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  useEffect(()=>{Promise.all([fetchLandingPages(true),fetchCategories()]).then(([items,categories])=>{setPages(items);setCategories(categories);}).catch(()=>setMessage('Не удалось загрузить страницы'));},[]);
  const copy=page.translations[locale] || blank;
  const text=(key:keyof LandingTranslation,value:string)=>setPage({...page,translations:{...page.translations,[locale]:{...copy,[key]:value}}});
  return <div className="space-y-6"><h1 className="text-3xl font-bold">SEO-страницы</h1><p className="text-slate-600">Создайте содержательные подборки по категории, городу или типу сделки. Каждая опубликованная языковая версия должна иметь собственные заголовок, описание и текст.</p>
    <div className="flex flex-wrap gap-3"><button className="rounded-xl border bg-white px-4 py-2" onClick={()=>{setPage(empty);setMessage('');}}>Новая страница</button>{pages.map(item=><button className="rounded-xl border bg-white px-4 py-2" key={item.id} onClick={()=>{setPage(item);setMessage('');}}>{item.translations[defaultLocale]?.title || item.slug}{!item.is_published?' · Черновик':''}</button>)}</div>
    <form className="max-w-4xl space-y-5 rounded-2xl border bg-white p-6" onSubmit={async event=>{event.preventDefault();setBusy(true);setMessage('');try{const saved=await saveLandingPage(page);setPage(saved);setPages(items=>[...items.filter(item=>item.id!==saved.id),saved]);setMessage('Сохранено');}catch(error){setMessage(error instanceof Error?error.message:'Ошибка сохранения');}finally{setBusy(false);}}}>
      <label className="block text-sm font-semibold">Адрес страницы<input required readOnly={Boolean(page.id)} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={field} value={page.slug} onChange={event=>setPage({...page,slug:event.target.value})}/></label>
      <div className="grid gap-4 md:grid-cols-3"><label>Категория<select className={field} value={page.filters.category_id || ''} onChange={event=>setPage({...page,filters:{...page.filters,category_id:event.target.value?Number(event.target.value):null}})}><option value="">Все категории</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Город<input className={field} value={page.filters.city || ''} onChange={event=>setPage({...page,filters:{...page.filters,city:event.target.value}})}/></label><label>Тип сделки<select className={field} value={page.filters.transaction_type || ''} onChange={event=>setPage({...page,filters:{...page.filters,transaction_type:(event.target.value || null) as 'sale'|'rent'|null}})}><option value="">Все сделки</option><option value="sale">Продажа</option><option value="rent">Аренда</option></select></label></div>
      <div className="flex gap-3">{activeLocales.map(value=><button className={`rounded-xl border px-4 py-2 ${value===locale?'bg-primary text-white':''}`} key={value} type="button" onClick={()=>setLocale(value)}>{localeLabels[value]}</button>)}</div>
      <label className="block">Заголовок страницы<input className={field} value={copy.title} onChange={event=>text('title',event.target.value)}/></label>
      <label className="block">Описание для посетителя и поиска<textarea className={field} rows={3} value={copy.description} onChange={event=>text('description',event.target.value)}/></label>
      <label className="block">SEO-заголовок (необязательно)<input className={field} value={copy.meta_title} onChange={event=>text('meta_title',event.target.value)}/></label>
      <label className="block">Основной текст<textarea className={field} rows={12} value={copy.content} onChange={event=>text('content',event.target.value)}/></label>
      <p className="text-sm text-slate-500">Разделяйте абзацы пустой строкой. Подзаголовок: ## Заголовок. Список: - пункт. Ссылка: [текст](/en/properties). HTML не выполняется.</p>
      <label className="flex gap-2"><input type="checkbox" checked={page.is_published} onChange={event=>setPage({...page,is_published:event.target.checked})}/>Опубликовать</label>
      <div className="flex items-center gap-5"><button disabled={busy} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white">{busy?'Сохранение…':'Сохранить'}</button>{page.id && page.is_published && <Link href={`/${locale}/collections/${page.slug}`} target="_blank">Открыть страницу</Link>}</div>
      {message && <p role="status">{message}</p>}
    </form>
  </div>;
}
